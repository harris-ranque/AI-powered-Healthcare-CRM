import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Appointment } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export type AppointmentActor = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    actor: AppointmentActor,
  ): Promise<Appointment> {
    await this.assertPatientInOrg(dto.patientId, actor.organizationId);

    const appointment = await this.prisma.client.appointment.create({
      data: {
        organizationId: actor.organizationId,
        patientId: dto.patientId,
        providerId: dto.providerId,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        status: dto.status ?? 'SCHEDULED',
        reason: dto.reason,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'APPOINTMENT_CREATED',
      resource: 'APPOINTMENT',
      resourceId: appointment.id,
      metadata: { patientId: dto.patientId },
    });

    return appointment;
  }

  list(
    organizationId: string,
    query: ListAppointmentsDto,
  ): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = {
      organizationId,
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.client.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    actor: AppointmentActor,
  ): Promise<Appointment> {
    const existing = await this.findOwnedAppointment(id, actor.organizationId);

    if (dto.patientId) {
      await this.assertPatientInOrg(dto.patientId, actor.organizationId);
    }

    const appointment = await this.prisma.client.appointment.update({
      where: { id: existing.id },
      data: {
        ...(dto.patientId !== undefined ? { patientId: dto.patientId } : {}),
        ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: new Date(dto.startsAt) }
          : {}),
        ...(dto.endsAt !== undefined
          ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'APPOINTMENT_UPDATED',
      resource: 'APPOINTMENT',
      resourceId: appointment.id,
      metadata: { patientId: appointment.patientId },
    });

    return appointment;
  }

  async delete(id: string, actor: AppointmentActor): Promise<{ id: string }> {
    const existing = await this.findOwnedAppointment(id, actor.organizationId);

    await this.prisma.client.appointment.delete({
      where: { id: existing.id },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'APPOINTMENT_DELETED',
      resource: 'APPOINTMENT',
      resourceId: existing.id,
      metadata: { patientId: existing.patientId },
    });

    return { id: existing.id };
  }

  countToday(organizationId: string): Promise<number> {
    const { start, end } = this.getTodayRange();

    return this.prisma.client.appointment.count({
      where: {
        organizationId,
        startsAt: { gte: start, lte: end },
      },
    });
  }

  private getTodayRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async assertPatientInOrg(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id: patientId, organizationId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
  }

  private async findOwnedAppointment(
    id: string,
    organizationId: string,
  ): Promise<Appointment> {
    const appointment = await this.prisma.client.appointment.findFirst({
      where: { id, organizationId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }
}
