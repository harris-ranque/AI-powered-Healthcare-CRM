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
import type { Patient } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { CreatePatientDto } from './dto/create-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import type { Paginated } from './types/paginated.type';
import type { PatientDetail } from './types/patient-detail.type';

@Controller('patients')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @RequirePermissions(Permission.PATIENT_READ)
  list(
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: ListPatientsDto,
  ): Promise<Paginated<Patient>> {
    return this.patientsService.list(organization.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.PATIENT_READ)
  getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<PatientDetail> {
    return this.patientsService.getDetail(id, organization.organizationId);
  }

  @Post()
  @RequirePermissions(Permission.PATIENT_WRITE)
  create(
    @Body() dto: CreatePatientDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<Patient> {
    return this.patientsService.create(dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Patch(':id')
  @RequirePermissions(Permission.PATIENT_WRITE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<Patient> {
    return this.patientsService.update(id, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Delete(':id')
  @RequirePermissions(Permission.PATIENT_DELETE)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ id: string }> {
    return this.patientsService.remove(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Post(':id/restore')
  @RequirePermissions(Permission.PATIENT_DELETE)
  restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<Patient> {
    return this.patientsService.restore(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
