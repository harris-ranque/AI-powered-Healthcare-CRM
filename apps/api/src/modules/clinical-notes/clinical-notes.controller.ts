import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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

import { ClinicalNotesService } from './clinical-notes.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get(':id/notes')
  @RequirePermissions(Permission.PATIENT_READ)
  listNotes(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Query('search') search?: string,
  ) {
    return this.clinicalNotesService.listForPatient(
      id,
      organization.organizationId,
      search,
    );
  }

  @Post(':id/notes')
  @RequirePermissions(Permission.PATIENT_WRITE)
  createNote(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateClinicalNoteDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.create(id, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}

@Controller('notes')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class NoteActionsController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get(':noteId')
  @RequirePermissions(Permission.PATIENT_READ)
  getNote(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.clinicalNotesService.getById(
      noteId,
      organization.organizationId,
    );
  }

  @Patch(':noteId')
  @RequirePermissions(Permission.PATIENT_WRITE)
  updateNote(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @Body() dto: UpdateClinicalNoteDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.update(noteId, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Delete(':noteId')
  @RequirePermissions(Permission.PATIENT_WRITE)
  deleteNote(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.remove(noteId, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Post(':noteId/summarize')
  @RequirePermissions(Permission.AI_SUMMARY)
  summarizeNote(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.summarize(noteId, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Post(':noteId/key-points')
  @RequirePermissions(Permission.AI_SUMMARY)
  generateKeyPoints(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.generateKeyPoints(noteId, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Post(':noteId/visit-summary')
  @RequirePermissions(Permission.AI_SUMMARY)
  generateVisitSummary(
    @Param('noteId', new ParseUUIDPipe()) noteId: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicalNotesService.generateVisitSummary(noteId, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
