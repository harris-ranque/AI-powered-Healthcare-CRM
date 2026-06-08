import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { mockPrismaService } from '../../test/testing-utils';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../realtime/realtime.service';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaAppointment: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let prismaPatient: {
    findFirst: jest.Mock;
  };
  let auditLog: jest.Mock;

  const ORG_ID = 'org-1';
  const USER_ID = 'user-1';
  const PATIENT_ID = 'patient-1';
  const PROVIDER_ID = 'doctor-1';

  function buildCreateDto(
    overrides: Partial<CreateAppointmentDto> = {},
  ): CreateAppointmentDto {
    const dto = new CreateAppointmentDto();
    Object.assign(dto, {
      patientId: PATIENT_ID,
      startsAt: '2026-06-05T09:00:00.000Z',
      endsAt: '2026-06-05T10:00:00.000Z',
      ...overrides,
    });
    return dto;
  }

  beforeEach(async () => {
    auditLog = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        mockPrismaService,
        { provide: AuditService, useValue: { log: auditLog } },
        {
          provide: RealtimeService,
          useValue: { emitNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    const prisma = module.get<PrismaService>(PrismaService);
    prismaAppointment = (
      prisma as unknown as { client: { appointment: typeof prismaAppointment } }
    ).client.appointment;
    prismaPatient = (
      prisma as unknown as { client: { patient: typeof prismaPatient } }
    ).client.patient;

    Object.values(prismaAppointment).forEach((fn) => fn.mockReset());
    prismaPatient.findFirst.mockReset();
    auditLog.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('validates patient in org and audits creation', async () => {
      const dto = buildCreateDto();

      prismaPatient.findFirst.mockResolvedValue({ id: PATIENT_ID });
      prismaAppointment.findFirst.mockResolvedValue(null);
      prismaAppointment.create.mockResolvedValue({
        id: 'appt-1',
        organizationId: ORG_ID,
        patientId: PATIENT_ID,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: AppointmentStatus.SCHEDULED,
      });

      const result = await service.create(dto, {
        organizationId: ORG_ID,
        userId: USER_ID,
      });

      expect(prismaPatient.findFirst).toHaveBeenCalledWith({
        where: { id: PATIENT_ID, organizationId: ORG_ID, deletedAt: null },
      });
      expect(prismaAppointment.create).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'APPOINTMENT_CREATED',
          resource: 'APPOINTMENT',
          resourceId: 'appt-1',
          metadata: { patientId: PATIENT_ID },
        }),
      );
      expect(result.id).toBe('appt-1');
    });

    it('throws when patient is not in org', async () => {
      const dto = buildCreateDto();
      prismaPatient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(dto, { organizationId: ORG_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when endsAt is not after startsAt', async () => {
      const dto = buildCreateDto({
        startsAt: '2026-06-05T10:00:00.000Z',
        endsAt: '2026-06-05T10:00:00.000Z',
      });
      prismaPatient.findFirst.mockResolvedValue({ id: PATIENT_ID });

      await expect(
        service.create(dto, { organizationId: ORG_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaAppointment.create).not.toHaveBeenCalled();
    });

    it('rejects overlapping doctor appointment', async () => {
      const dto = buildCreateDto({
        providerId: PROVIDER_ID,
        startsAt: '2026-06-05T09:30:00.000Z',
        endsAt: '2026-06-05T10:30:00.000Z',
      });

      prismaPatient.findFirst.mockResolvedValue({ id: PATIENT_ID });
      prismaAppointment.findFirst.mockResolvedValue({ id: 'existing-appt' });

      await expect(
        service.create(dto, { organizationId: ORG_ID, userId: USER_ID }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prismaAppointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            providerId: PROVIDER_ID,
            status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
            startsAt: { lt: new Date(dto.endsAt) },
            endsAt: { gt: new Date(dto.startsAt) },
          }),
        }),
      );
      expect(prismaAppointment.create).not.toHaveBeenCalled();
    });

    it('succeeds when no provider conflict exists', async () => {
      const dto = buildCreateDto({ providerId: PROVIDER_ID });

      prismaPatient.findFirst.mockResolvedValue({ id: PATIENT_ID });
      prismaAppointment.findFirst.mockResolvedValue(null);
      prismaAppointment.create.mockResolvedValue({
        id: 'appt-2',
        providerId: PROVIDER_ID,
      });

      const result = await service.create(dto, {
        organizationId: ORG_ID,
        userId: USER_ID,
      });

      expect(result.id).toBe('appt-2');
    });
  });

  describe('update()', () => {
    it('excludes self from provider conflict check', async () => {
      const existing = {
        id: 'appt-1',
        organizationId: ORG_ID,
        patientId: PATIENT_ID,
        providerId: PROVIDER_ID,
        startsAt: new Date('2026-06-05T09:00:00.000Z'),
        endsAt: new Date('2026-06-05T10:00:00.000Z'),
        status: AppointmentStatus.SCHEDULED,
      };

      const dto = new UpdateAppointmentDto();
      Object.assign(dto, {
        startsAt: '2026-06-05T09:30:00.000Z',
        endsAt: '2026-06-05T10:30:00.000Z',
      });

      prismaAppointment.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null);
      prismaAppointment.update.mockResolvedValue({
        ...existing,
        startsAt: new Date(dto.startsAt!),
        endsAt: new Date(dto.endsAt!),
      });

      await service.update('appt-1', dto, {
        organizationId: ORG_ID,
        userId: USER_ID,
      });

      expect(prismaAppointment.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'appt-1' },
            providerId: PROVIDER_ID,
          }),
        }),
      );
    });
  });

  describe('getById()', () => {
    it('throws NotFound when appointment is missing', async () => {
      prismaAppointment.findFirst.mockResolvedValue(null);

      await expect(service.getById('missing', ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('countToday()', () => {
    it('counts appointments within today range', async () => {
      prismaAppointment.count.mockResolvedValue(3);

      const result = await service.countToday(ORG_ID);

      expect(result).toBe(3);
      expect(prismaAppointment.count).toHaveBeenCalledWith({
        where: {
          organizationId: ORG_ID,
          startsAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const call = prismaAppointment.count.mock.calls[0][0];
      const start = call.where.startsAt.gte as Date;
      const end = call.where.startsAt.lte as Date;
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
    });
  });
});
