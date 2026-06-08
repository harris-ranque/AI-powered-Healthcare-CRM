import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { AiService } from './ai.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class PatientAiController {
  constructor(private readonly aiService: AiService) {}

  @Get(':id/ai-summaries')
  @RequirePermissions(Permission.PATIENT_READ)
  listAiSummaries(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.aiService.listForPatient(id, organization.organizationId);
  }
}
