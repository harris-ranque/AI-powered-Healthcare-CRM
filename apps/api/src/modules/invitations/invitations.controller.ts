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
import { InvitationStatus, Role } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequireAnyPermissions } from '../../common/decorators/require-any-permissions.decorator';
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
  @RequireAnyPermissions(Permission.CLIENT_INVITE, Permission.STAFF_INVITE)
  @Get('invitations')
  listInvitations(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('status') status?: InvitationStatus,
    @Query('role') role?: Role,
    @Query('inviteeType') inviteeType?: 'client' | 'staff',
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
    if (
      role &&
      role !== Role.PATIENT &&
      role !== Role.DOCTOR &&
      role !== Role.NURSE &&
      role !== Role.RECEPTIONIST
    ) {
      throw new BadRequestException('Invalid role filter');
    }
    if (inviteeType && inviteeType !== 'client' && inviteeType !== 'staff') {
      throw new BadRequestException('Invalid inviteeType filter');
    }
    return this.invitationsService.listForOrganization(
      organization.organizationId,
      status,
      role,
      inviteeType,
    );
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  @Post('invitations')
  createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invitationsService.create(dto, organization, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequireAnyPermissions(Permission.CLIENT_INVITE, Permission.STAFF_INVITE)
  @Patch('invitations/:id/revoke')
  revokeInvitation(
    @Param('id') id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.invitationsService.revoke(id, organization.organizationId);
  }

  @UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
  @RequireAnyPermissions(Permission.CLIENT_INVITE, Permission.STAFF_INVITE)
  @Patch('invitations/:id/resend')
  resendInvitation(
    @Param('id') id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invitationsService.resend(id, organization, req.user.sub);
  }
}
