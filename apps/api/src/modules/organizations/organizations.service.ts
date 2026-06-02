import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Organization, Role as PrismaRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.client.$transaction(async (tx) => {
      const organization = await tx.organization.create({
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

      // Owners get an ADMIN membership so the org context guard sees them.
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: PrismaRole.ADMIN,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          role: Role.VENDOR,
          organizationId: organization.id,
        },
      });

      return organization;
    });
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
}
