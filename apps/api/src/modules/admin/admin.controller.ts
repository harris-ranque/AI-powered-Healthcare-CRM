import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';

import {
  AdminAnalyticsService,
  type AdminAnalytics,
} from './admin-analytics.service';
import {
  AdminHealthService,
  type AdminHealthResponse,
} from './admin-health.service';
import {
  AdminService,
  type AdminAiUsage,
  type AdminOrganizationRow,
  type AdminOverview,
  type AdminSubscriptionSummary,
} from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminHealthService: AdminHealthService,
    private readonly adminAnalyticsService: AdminAnalyticsService,
  ) {}

  @Get('overview')
  getOverview(): Promise<AdminOverview> {
    return this.adminService.getOverview();
  }

  @Get('organizations')
  listOrganizations(): Promise<AdminOrganizationRow[]> {
    return this.adminService.listOrganizations();
  }

  @Get('subscriptions')
  getSubscriptions(): Promise<AdminSubscriptionSummary> {
    return this.adminService.getSubscriptionSummary();
  }

  @Get('ai-usage')
  getAiUsage(): Promise<AdminAiUsage> {
    return this.adminService.getAiUsage();
  }

  @Get('health')
  getHealth(): Promise<AdminHealthResponse> {
    return this.adminHealthService.getHealth();
  }

  @Get('analytics')
  getAnalytics(): Promise<AdminAnalytics> {
    return this.adminAnalyticsService.getAnalytics();
  }
}
