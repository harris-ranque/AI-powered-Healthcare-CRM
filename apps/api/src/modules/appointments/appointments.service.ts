import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../realtime/realtime.service';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export const appointmentInclude = {
  patient: { select: { id: true, firstName: true, lastName: true } },
  provider: { select: { id: true, name: true, email: true } },
} as const;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export type AppointmentActor = {
  organizationId: string;
  userId: string;
};

const INACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    actor: AppointmentActor,
  ): Promise<AppointmentWithRelations> {
    await this.assertPatientInOrg(dto.patientId, actor.organizationId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertValidRange(startsAt, endsAt);
    await this.assertNoProviderConflict(
      actor.organizationId,
      dto.providerId,
      startsAt,
      endsAt,
    );

    const appointment = await this.prisma.client.appointment.create({
      data: {
        organizationId: actor.organizationId,
        patientId: dto.patientId,
        providerId: dto.providerId,
        startsAt,
        endsAt,
        status: dto.status ?? AppointmentStatus.SCHEDULED,
        title: dto.title,
        reason: dto.reason,
        notes: dto.notes,
      },
      include: appointmentInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'APPOINTMENT_CREATED',
      resource: 'APPOINTMENT',
      resourceId: appointment.id,
      metadata: { patientId: dto.patientId },
    });

    const patientName = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : 'a patient';
    this.realtimeService.emitNotification(actor.organizationId, {
      type: 'APPOINTMENT_CREATED',
      title: 'Appointment created',
      message: `Appointment scheduled for ${patientName}`,
      actorId: actor.userId,
      createdAt: new Date().toISOString(),
      metadata: {
        appointmentId: appointment.id,
        patientId: dto.patientId,
      },
    });

    return appointment;
  }

  list(
    organizationId: string,
    query: ListAppointmentsDto,
  ): Promise<AppointmentWithRelations[]> {
    const where: Prisma.AppointmentWhereInput = {
      organizationId,
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.providerId ? { providerId: query.providerId } : {}),
      ...(query.status ? { status: query.status } : {}),
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
      include: appointmentInclude,
    });
  }

  getById(id: string, organizationId: string): Promise<AppointmentWithRelations> {
    return this.findOwnedAppointment(id, organizationId);
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    actor: AppointmentActor,
  ): Promise<AppointmentWithRelations> {
    const existing = await this.findOwnedAppointment(id, actor.organizationId);

    if (dto.patientId) {
      await this.assertPatientInOrg(dto.patientId, actor.organizationId);
    }

    const startsAt =
      dto.startsAt !== undefined ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined ? new Date(dto.endsAt) : existing.endsAt;
    const providerId =
      dto.providerId !== undefined ? dto.providerId : existing.providerId;

    this.assertValidRange(startsAt, endsAt);
    await this.assertNoProviderConflict(
      actor.organizationId,
      providerId,
      startsAt,
      endsAt,
      existing.id,
    );

    const appointment = await this.prisma.client.appointment.update({
      where: { id: existing.id },
      data: {
        ...(dto.patientId !== undefined ? { patientId: dto.patientId } : {}),
        ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: appointmentInclude,
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

  private assertValidRange(startsAt: Date, endsAt: Date): void {
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
  }

  private async assertNoProviderConflict(
    organizationId: string,
    providerId: string | null | undefined,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<void> {
    if (!providerId) {
      return;
    }

    const conflict = await this.prisma.client.appointment.findFirst({
      where: {
        organizationId,
        providerId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { notIn: INACTIVE_STATUSES },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (conflict) {
      throw new ConflictException(
        'Doctor already has an overlapping appointment',
      );
    }
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
  ): Promise<AppointmentWithRelations> {
    const appointment = await this.prisma.client.appointment.findFirst({
      where: { id, organizationId },
      include: appointmentInclude,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }
}
