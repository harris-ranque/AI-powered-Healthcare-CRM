import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class PatientCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  @RequirePermissions(Permission.PATIENT_READ)
  listComments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.commentsService.listForPatient(id, organization.organizationId);
  }

  @Post(':id/comments')
  @RequirePermissions(Permission.PATIENT_WRITE)
  createComment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.createForPatient(id, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }
}

@Controller('appointments')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AppointmentCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  @RequirePermissions(Permission.APPOINTMENT_READ)
  listComments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.commentsService.listForAppointment(
      id,
      organization.organizationId,
    );
  }

  @Post(':id/comments')
  @RequirePermissions(Permission.APPOINTMENT_WRITE)
  createComment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.createForAppointment(id, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }
}

@Controller('comments')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class CommentActionsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Delete(':commentId')
  @RequirePermissions(Permission.PATIENT_READ)
  deleteComment(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.remove(commentId, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }
}
