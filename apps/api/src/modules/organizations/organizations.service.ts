import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Organization, Role as PrismaRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UsageMetric } from '../usage-tracking/usage-metric.constants';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

export type OrganizationMemberListItem = {
  userId: string;
  email: string;
  name: string | null;
  role: PrismaRole;
  status: MemberStatus;
  createdAt: Date;
};

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    // ================================
    // Check Existing Slug
    // ================================
    const existingSlug = await this.prisma.client.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // ==================================
    // Check If User Already Owns
    // Organization
    // ==================================
    const existingOrganization =
      await this.prisma.client.organization.findFirst({
        where: { ownerId: userId },
      });

    if (existingOrganization) {
      throw new BadRequestException('User already owns organization');
    }

    // ========================================
    // Create Organization + Membership + Role
    // ========================================
    const organization = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          ownerId: userId,
          members: {
            connect: { id: userId },
          },
        },
        include: { members: true },
      });

      // Owners get an ACTIVE CLINIC_OWNER membership for the org context guard.
      await tx.organizationMember.create({
        data: {
          organizationId: created.id,
          userId,
          role: PrismaRole.CLINIC_OWNER,
          status: MemberStatus.ACTIVE,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          role: PrismaRole.CLINIC_OWNER,
          organizationId: created.id,
        },
      });

      return created;
    });

    void this.usageTrackingService.increment(
      organization.id,
      UsageMetric.USERS,
    );

    return organization;
  }

  // ================================
  // Get the organization the
  // requester owns (legacy endpoint)
  // ================================
  async getMyOrganizations(userId: string): Promise<Organization> {
    const organization = await this.prisma.client.organization.findFirst({
      where: { ownerId: userId },
      include: { members: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  // ================================
  // Fetch the active organization
  // resolved from the request
  // ================================
  async getById(organizationId: string): Promise<Organization> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async listMembers(
    organizationId: string,
    status?: MemberStatus,
  ): Promise<OrganizationMemberListItem[]> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    const members = await this.prisma.client.organizationMember.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        ...(organization?.ownerId
          ? { userId: { not: organization.ownerId } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return members.map((member) => ({
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
    }));
  }

  async updateMemberStatus(
    organizationId: string,
    userId: string,
    status: MemberStatus,
  ): Promise<{ userId: string; status: MemberStatus }> {
    const member = await this.prisma.client.organizationMember.findFirst({
      where: { organizationId, userId },
      select: { id: true, status: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const updated = await this.prisma.client.organizationMember.update({
      where: { id: member.id },
      data: { status },
      select: { userId: true, status: true },
    });

    const wasBillable = member.status !== MemberStatus.DISABLED;
    const isBillable = updated.status !== MemberStatus.DISABLED;

    if (wasBillable && !isBillable) {
      void this.usageTrackingService.decrement(
        organizationId,
        UsageMetric.USERS,
      );
    } else if (!wasBillable && isBillable) {
      void this.usageTrackingService.increment(
        organizationId,
        UsageMetric.USERS,
      );
    }

    return updated;
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: PrismaRole,
  ): Promise<{ userId: string; role: PrismaRole }> {
    const member = await this.prisma.client.organizationMember.findFirst({
      where: { organizationId, userId },
      select: { id: true, role: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const updated = await this.prisma.client.organizationMember.update({
      where: { id: member.id },
      data: { role },
      select: { userId: true, role: true },
    });

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { role },
    });

    return updated;
  }

  async searchPublic(query: string): Promise<{ name: string; slug: string }[]> {
    const q = query.trim();
    if (q.length < 2) {
      return [];
    }

    return this.prisma.client.organization.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { name: true, slug: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }
}
