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
import type { Appointment } from '@prisma/client';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @RequirePermissions(Permission.APPOINTMENT_WRITE)
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<Appointment> {
    return this.appointmentsService.create(dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Get()
  @RequirePermissions(Permission.APPOINTMENT_READ)
  list(
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: ListAppointmentsDto,
  ): Promise<Appointment[]> {
    return this.appointmentsService.list(organization.organizationId, query);
  }

  @Patch(':id')
  @RequirePermissions(Permission.APPOINTMENT_WRITE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<Appointment> {
    return this.appointmentsService.update(id, dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Delete(':id')
  @RequirePermissions(Permission.APPOINTMENT_WRITE)
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ id: string }> {
    return this.appointmentsService.delete(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
