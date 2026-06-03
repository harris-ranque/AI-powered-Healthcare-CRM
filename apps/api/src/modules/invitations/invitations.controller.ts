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
import { InvitationStatus } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('invitations/lookup')
  lookupInvitation(@Query('token') token?: string) {
    if (!token) {
      throw new BadRequestException('token query parameter is required');
    }
    return this.invitationsService.getByToken(token);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.CLIENT_INVITE)
  @Get('invitations')
  listInvitations(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('status') status?: InvitationStatus,
  ) {
    if (
      status &&
      status !== InvitationStatus.PENDING &&
      status !== InvitationStatus.ACCEPTED &&
      status !== InvitationStatus.REVOKED &&
      status !== InvitationStatus.EXPIRED
    ) {
      throw new BadRequestException('Invalid status filter');
    }
    return this.invitationsService.listForOrganization(
      organization.organizationId,
      status,
    );
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Post('invitations')
  createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invitationsService.create(
      dto,
      organization,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequirePermissions(Permission.CLIENT_INVITE)
  @Patch('invitations/:id/revoke')
  revokeInvitation(
    @Param('id') id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.invitationsService.revoke(id, organization.organizationId);
  }
}
