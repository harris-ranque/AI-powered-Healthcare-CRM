import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { AiService } from './ai.service';
import { MedicalNoteSummaryDto } from './dto/medical-note-summary.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('medical-note-summary')
  @RequirePermissions(Permission.AI_SUMMARY)
  summarize(
    @Body() dto: MedicalNoteSummaryDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiService.summarizeNote(dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
