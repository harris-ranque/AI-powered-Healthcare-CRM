import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { mockPrismaService } from '../../test/testing-utils';
import { AppointmentsService } from '../appointments/appointments.service';
import { AuditService } from '../audit/audit.service';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaPatient: { count: jest.Mock; findMany: jest.Mock };
  let prismaFile: { count: jest.Mock };
  let prismaAiRequestLog: { count: jest.Mock; findMany: jest.Mock };
  let countToday: jest.Mock;
  let listForOrganization: jest.Mock;

  const ORG_ID = 'org-1';

  beforeEach(async () => {
    countToday = jest.fn().mockResolvedValue(2);
    listForOrganization = jest.fn().mockResolvedValue([{ id: 'log-1' }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        mockPrismaService,
        { provide: AppointmentsService, useValue: { countToday } },
        {
          provide: AuditService,
          useValue: { listForOrganization },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    const prisma = module.get<PrismaService>(PrismaService);
    prismaPatient = (
      prisma as unknown as { client: { patient: typeof prismaPatient } }
    ).client.patient;
    prismaFile = (
      prisma as unknown as { client: { file: typeof prismaFile } }
    ).client.file;
    prismaAiRequestLog = (
      prisma as unknown as { client: { aiRequestLog: typeof prismaAiRequestLog } }
    ).client.aiRequestLog;

    prismaPatient.count.mockReset();
    prismaPatient.findMany.mockReset().mockResolvedValue([]);
    prismaFile.count.mockReset();
    prismaAiRequestLog.count.mockReset();
    prismaAiRequestLog.findMany.mockReset().mockResolvedValue([]);
    countToday.mockReset().mockResolvedValue(2);
    listForOrganization.mockReset().mockResolvedValue([{ id: 'log-1' }]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats()', () => {
    it('aggregates counts from prisma and appointments service', async () => {
      prismaPatient.count.mockResolvedValue(10);
      prismaFile.count.mockResolvedValue(5);
      prismaAiRequestLog.count.mockResolvedValue(3);
      countToday.mockResolvedValue(2);

      const result = await service.getStats(ORG_ID);

      expect(prismaPatient.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, deletedAt: null },
      });
      expect(prismaFile.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
      expect(prismaAiRequestLog.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
      expect(countToday).toHaveBeenCalledWith(ORG_ID);
      expect(result).toEqual({
        patients: 10,
        files: 5,
        aiSummaries: 3,
        appointmentsToday: 2,
      });
    });
  });

  describe('getRecentActivity()', () => {
    it('delegates to audit service listForOrganization', async () => {
      const events = [{ id: 'log-1', action: 'PATIENT_CREATED' }];
      listForOrganization.mockResolvedValue(events);

      const result = await service.getRecentActivity(ORG_ID);

      expect(listForOrganization).toHaveBeenCalledWith(ORG_ID, { take: 10 });
      expect(result).toEqual(events);
    });
  });

  describe('getAnalytics()', () => {
    function utcDayKey(daysAgo: number): string {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      return date.toISOString().slice(0, 10);
    }

    it('returns zero-filled buckets with cumulative baseline', async () => {
      prismaPatient.count.mockResolvedValue(7);
      prismaPatient.findMany.mockResolvedValue([
        { createdAt: new Date(`${utcDayKey(1)}T12:00:00.000Z`) },
        { createdAt: new Date(`${utcDayKey(1)}T18:00:00.000Z`) },
        { createdAt: new Date(`${utcDayKey(0)}T09:00:00.000Z`) },
      ]);
      prismaAiRequestLog.findMany.mockResolvedValue([
        { createdAt: new Date(`${utcDayKey(0)}T10:00:00.000Z`) },
      ]);

      const result = await service.getAnalytics(ORG_ID, 3);

      expect(prismaPatient.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
            deletedAt: null,
          }),
        }),
      );
      expect(prismaPatient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );
      expect(prismaAiRequestLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        }),
      );

      expect(result.patientGrowth).toHaveLength(3);
      expect(result.aiUsage).toHaveLength(3);

      const yesterday = result.patientGrowth.find(
        (point) => point.date === utcDayKey(1),
      );
      const today = result.patientGrowth.find(
        (point) => point.date === utcDayKey(0),
      );

      expect(yesterday?.newPatients).toBe(2);
      expect(yesterday?.cumulative).toBe(9);
      expect(today?.newPatients).toBe(1);
      expect(today?.cumulative).toBe(10);

      const todayAi = result.aiUsage.find((point) => point.date === utcDayKey(0));
      expect(todayAi?.requests).toBe(1);
      expect(
        result.aiUsage.every((point) => typeof point.requests === 'number'),
      ).toBe(true);
    });
  });
});
