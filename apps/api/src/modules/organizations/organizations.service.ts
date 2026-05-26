import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Organization } from '@prisma/client';
import { Role } from '../../common/enums/role.enum';

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
      where: {
        slug: dto.slug,
      },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    // ==================================
    // Check If User Already
    // Owns Organization
    // ==================================
    const existingOrganization =
      await this.prisma.client.organization.findFirst({
        where: {
          ownerId: userId,
        },
      });

    if (existingOrganization) {
      throw new BadRequestException('User already owns organization');
    }

    // ========================================
    // Create Organization
    // ========================================
    const organization = await this.prisma.client.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        ownerId: userId,
        members: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    // ========================================
    // Update User Role
    // ========================================
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        role: Role.VENDOR,
        organizationId: organization.id,
      },
    });

    // ========================================
    // Return Organization
    // ========================================
    return organization;
  }

  // ================================
  // Get My Organizations
  // ================================
  async getMyOrganizations(userId: string): Promise<Organization> {
    const organization = await this.prisma.client.organization.findFirst({
      where: {
        ownerId: userId,
      },
      include: {
        members: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  // ================================
  // Find One Organization
  // ================================
}
