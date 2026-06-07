import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { AuditService, type AuditLogWithUser } from './audit.service';

const DEFAULT_ACTIVITY_ACTIONS = [
  'PATIENT_CREATED',
  'APPOINTMENT_CREATED',
  'FILE_UPLOADED',
  'AI_SUMMARIZED',
] as const;

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

  @Get('activity')
  @RequirePermissions(Permission.AUDIT_READ)
  getOrganizationActivity(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('actions') actions?: string,
    @Query('take') take?: string,
  ): Promise<AuditLogWithUser[]> {
    const requested = actions
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const allowed = (
      requested?.length ? requested : [...DEFAULT_ACTIVITY_ACTIONS]
    ).filter((value) =>
      (DEFAULT_ACTIVITY_ACTIONS as readonly string[]).includes(value),
    );

    return this.auditService.listForOrganization(organization.organizationId, {
      actions: allowed.length ? allowed : [...DEFAULT_ACTIVITY_ACTIONS],
      take: take ? Number(take) : 50,
    });
  }
}
