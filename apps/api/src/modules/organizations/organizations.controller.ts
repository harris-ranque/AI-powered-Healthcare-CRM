import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MemberStatus, Role, type Organization } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
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

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.MEMBER_MANAGE)
  @Get('current/members')
  listMembers(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('status') status?: MemberStatus,
  ) {
    if (
      status &&
      status !== MemberStatus.PENDING &&
      status !== MemberStatus.ACTIVE &&
      status !== MemberStatus.DISABLED
    ) {
      throw new BadRequestException(
        'status must be PENDING, ACTIVE, or DISABLED',
      );
    }
    return this.organizationsService.listMembers(
      organization.organizationId,
      status,
    );
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.MEMBER_MANAGE)
  @Patch('current/members/:userId/status')
  updateMemberStatus(
    @CurrentOrganization() organization: OrganizationContext,
    @Param('userId') userId: string,
    @Body('status') status: MemberStatus,
  ) {
    if (
      status !== MemberStatus.PENDING &&
      status !== MemberStatus.ACTIVE &&
      status !== MemberStatus.DISABLED
    ) {
      throw new BadRequestException(
        'status must be PENDING, ACTIVE, or DISABLED',
      );
    }
    return this.organizationsService.updateMemberStatus(
      organization.organizationId,
      userId,
      status,
    );
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.MEMBER_MANAGE)
  @Patch('current/members/:userId/role')
  updateMemberRole(
    @CurrentOrganization() organization: OrganizationContext,
    @Param('userId') userId: string,
    @Body('role') role: Role,
  ) {
    const allowed: Role[] = [
      Role.DOCTOR,
      Role.NURSE,
      Role.RECEPTIONIST,
      Role.CLINIC_OWNER,
    ];
    if (!allowed.includes(role)) {
      throw new BadRequestException('Invalid role update');
    }
    return this.organizationsService.updateMemberRole(
      organization.organizationId,
      userId,
      role,
    );
  }
}
