import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { mockPrismaService } from '../../test/testing-utils';
import { AppointmentsService } from '../appointments/appointments.service';
import { AuditService } from '../audit/audit.service';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaPatient: { count: jest.Mock };
  let prismaFile: { count: jest.Mock };
  let prismaAiRequestLog: { count: jest.Mock };
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
    prismaFile.count.mockReset();
    prismaAiRequestLog.count.mockReset();
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
});
