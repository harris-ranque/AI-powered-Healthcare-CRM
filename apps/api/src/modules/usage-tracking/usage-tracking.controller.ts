import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { UsageTrackingService } from './usage-tracking.service';

@Controller('usage')
export class UsageTrackingController {
  constructor(private readonly usageTrackingService: UsageTrackingService) {}

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.MEMBER_MANAGE)
  @Get()
  getCurrentUsage(@CurrentOrganization() organization: OrganizationContext) {
    return this.usageTrackingService.getCurrentUsage(
      organization.organizationId,
    );
  }
}
