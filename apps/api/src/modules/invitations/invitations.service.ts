import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  Role,
  type Prisma,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../queues/email/email.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

const STAFF_ROLES: Role[] = [Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST];

export type InvitationLookupResult = {
  email: string;
  role: Role;
  organization: { name: string; slug: string };
};

export type InvitationListItem = {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedByName: string | null;
};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateInvitationDto,
    organization: OrganizationContext,
    invitedByUserId: string,
  ): Promise<InvitationListItem> {
    this.assertCanInvite(dto.role, organization.permissions);

    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      const existingMember =
        await this.prisma.client.organizationMember.findFirst({
          where: {
            organizationId: organization.organizationId,
            userId: existingUser.id,
          },
        });
      if (existingMember) {
        throw new BadRequestException('User is already a member of this clinic');
      }
    }

    const pendingInvite = await this.prisma.client.invitation.findFirst({
      where: {
        organizationId: organization.organizationId,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvite) {
      throw new BadRequestException('A pending invitation already exists for this email');
    }

    const org = await this.prisma.client.organization.findUnique({
      where: { id: organization.organizationId },
      select: { name: true, slug: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.client.invitation.create({
      data: {
        email,
        organizationId: organization.organizationId,
        role: dto.role,
        token,
        invitedByUserId,
        expiresAt,
      },
      include: {
        invitedBy: { select: { name: true } },
      },
    });

    const registerPath =
      dto.role === Role.PATIENT ? '/register/client' : '/register/staff';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}${registerPath}?invite=${encodeURIComponent(token)}`;

    await this.emailService.sendInvitationEmail({
      email,
      inviteUrl,
      organizationName: org.name,
      role: dto.role,
    });

    await this.auditService.log({
      userId: invitedByUserId,
      organizationId: organization.organizationId,
      action: 'USER_INVITED',
      resource: 'INVITATION',
      resourceId: invitation.id,
      metadata: { email, role: dto.role },
    });

    return this.toListItem(invitation);
  }

  async listForOrganization(
    organizationId: string,
    status?: InvitationStatus,
    role?: Role,
    inviteeType?: 'client' | 'staff',
  ): Promise<InvitationListItem[]> {
    const roleFilter =
      role ??
      (inviteeType === 'client'
        ? Role.PATIENT
        : inviteeType === 'staff'
          ? { in: STAFF_ROLES }
          : undefined);

    const invitations = await this.prisma.client.invitation.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { invitedBy: { select: { name: true } } },
    });

    return invitations.map((inv) => this.toListItem(inv));
  }

  async revoke(invitationId: string, organizationId: string): Promise<void> {
    const invitation = await this.prisma.client.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.prisma.client.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  async getByToken(token: string): Promise<InvitationLookupResult> {
    const invitation = await this.loadValidPendingInvitation(token);

    return {
      email: invitation.email,
      role: invitation.role,
      organization: {
        name: invitation.organization.name,
        slug: invitation.organization.slug,
      },
    };
  }

  async consume(
    token: string,
    email: string,
    tx: Prisma.TransactionClient,
  ): Promise<{
    organizationId: string;
    role: Role;
    clinicSlug: string;
  }> {
    const invitation = await tx.invitation.findUnique({
      where: { token },
      include: { organization: { select: { slug: true } } },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException('Email must match the invitation');
    }

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    return {
      organizationId: invitation.organizationId,
      role: invitation.role,
      clinicSlug: invitation.organization.slug,
    };
  }

  private async loadValidPendingInvitation(token: string) {
    const invitation = await this.prisma.client.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true, slug: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestException('Invitation was revoked');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('Invitation was already used');
    }

    if (
      invitation.status === InvitationStatus.EXPIRED ||
      invitation.expiresAt < new Date()
    ) {
      if (invitation.status === InvitationStatus.PENDING) {
        await this.prisma.client.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  private assertCanInvite(role: Role, permissions: string[]): void {
    const granted = new Set(permissions);

    if (role === Role.PATIENT) {
      if (!granted.has(Permission.CLIENT_INVITE)) {
        throw new ForbiddenException('Cannot invite clients');
      }
      return;
    }

    if (STAFF_ROLES.includes(role)) {
      if (!granted.has(Permission.STAFF_INVITE)) {
        throw new ForbiddenException('Cannot invite staff');
      }
      return;
    }

    throw new BadRequestException('Invalid invitation role');
  }

  private toListItem(invitation: {
    id: string;
    email: string;
    role: Role;
    status: InvitationStatus;
    expiresAt: Date;
    createdAt: Date;
    invitedBy: { name: string | null };
  }): InvitationListItem {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      invitedByName: invitation.invitedBy.name,
    };
  }
}
