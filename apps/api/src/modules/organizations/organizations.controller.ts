import { Controller, Body, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Organization } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ================================
  // Create Organization
  // ================================
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Organization> {
    return this.organizationsService.create(dto, req.user.sub);
  }

  // ================================
  // Get Owned Organization
  // ================================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrganizations(@Req() req: AuthenticatedRequest): Promise<Organization> {
    return this.organizationsService.getMyOrganizations(req.user.sub);
  }

  // ================================
  // Get Active Organization (from
  // resolved request context)
  // ================================
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Get('current')
  getCurrentOrganization(
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<Organization> {
    return this.organizationsService.getById(organization.organizationId);
  }
}
