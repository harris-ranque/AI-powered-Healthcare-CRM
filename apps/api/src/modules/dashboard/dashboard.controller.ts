import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuditLogWithUser } from '../audit/audit.service';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import {
  DashboardService,
  type DashboardAnalytics,
  type DashboardStats,
} from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermissions(Permission.PATIENT_READ)
  getStats(
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<DashboardStats> {
    return this.dashboardService.getStats(organization.organizationId);
  }

  @Get('activity')
  @RequirePermissions(Permission.PATIENT_READ)
  getActivity(
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<AuditLogWithUser[]> {
    return this.dashboardService.getRecentActivity(organization.organizationId);
  }

  @Get('analytics')
  @RequirePermissions(Permission.PATIENT_READ)
  getAnalytics(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('days') days?: string,
  ): Promise<DashboardAnalytics> {
    return this.dashboardService.getAnalytics(
      organization.organizationId,
      days ? Number(days) : undefined,
    );
  }
}
