import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  getAuditLogs(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('action') action?: string,
  ): Promise<AuditLog[]> {
    return this.auditService.list(organization.organizationId, { action });
  }
}
