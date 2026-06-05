import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { mockPrismaService } from '../../test/testing-utils';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { ClinicalNotesService } from '../clinical-notes/clinical-notes.service';
import { StorageService } from '../storage/storage.service';

import { ListPatientsDto } from './dto/list-patients.dto';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let prismaPatient: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let auditLog: jest.Mock;
  let listNotes: jest.Mock;
  let listFiles: jest.Mock;
  let listAiSummaries: jest.Mock;
  let listActivity: jest.Mock;

  const ORG_ID = 'org-1';
  const USER_ID = 'user-1';

  beforeEach(async () => {
    auditLog = jest.fn();
    listNotes = jest.fn().mockResolvedValue([]);
    listFiles = jest.fn().mockResolvedValue([]);
    listAiSummaries = jest.fn().mockResolvedValue([]);
    listActivity = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        mockPrismaService,
        { provide: AuditService, useValue: { log: auditLog, listForPatient: listActivity } },
        { provide: ClinicalNotesService, useValue: { listForPatient: listNotes } },
        { provide: StorageService, useValue: { listForPatient: listFiles } },
        { provide: AiService, useValue: { listForPatient: listAiSummaries } },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    const prisma = module.get<PrismaService>(PrismaService);
    prismaPatient = (
      prisma as unknown as { client: { patient: typeof prismaPatient } }
    ).client.patient;

    Object.values(prismaPatient).forEach((fn) => fn.mockReset());
    auditLog.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list()', () => {
    function buildQuery(
      overrides: Partial<ListPatientsDto> = {},
    ): ListPatientsDto {
      const dto = new ListPatientsDto();
      Object.assign(dto, {
        page: 1,
        limit: 20,
        sortBy: 'lastName',
        order: 'asc',
        ...overrides,
      });
      return dto;
    }

    it('paginates with correct skip/take and totalPages math', async () => {
      prismaPatient.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      prismaPatient.count.mockResolvedValue(45);

      const result = await service.list(
        ORG_ID,
        buildQuery({ page: 2, limit: 20 }),
      );

      expect(prismaPatient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID, deletedAt: null },
          skip: 20,
          take: 20,
          orderBy: [{ lastName: 'asc' }, { id: 'asc' }],
        }),
      );
      expect(prismaPatient.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, deletedAt: null },
      });
      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
      expect(result.data).toHaveLength(2);
    });

    it('returns totalPages 0 when there are no results', async () => {
      prismaPatient.findMany.mockResolvedValue([]);
      prismaPatient.count.mockResolvedValue(0);

      const result = await service.list(ORG_ID, buildQuery());

      expect(result.meta.totalPages).toBe(0);
    });

    it('builds dynamic orderBy from sortBy + order with a stable id tie-break', async () => {
      prismaPatient.findMany.mockResolvedValue([]);
      prismaPatient.count.mockResolvedValue(0);

      await service.list(
        ORG_ID,
        buildQuery({ sortBy: 'createdAt', order: 'desc' }),
      );

      expect(prismaPatient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
      );
    });

    it('applies a case-insensitive OR clause when search is provided', async () => {
      prismaPatient.findMany.mockResolvedValue([]);
      prismaPatient.count.mockResolvedValue(0);

      await service.list(ORG_ID, buildQuery({ search: 'jane' }));

      expect(prismaPatient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: ORG_ID,
            deletedAt: null,
            OR: [
              { firstName: { contains: 'jane', mode: 'insensitive' } },
              { lastName: { contains: 'jane', mode: 'insensitive' } },
              { email: { contains: 'jane', mode: 'insensitive' } },
              { phone: { contains: 'jane', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });

  describe('remove()', () => {
    it('soft-deletes by setting deletedAt and does not call prisma.patient.delete', async () => {
      prismaPatient.findFirst.mockResolvedValue({
        id: 'p1',
        organizationId: ORG_ID,
      });
      prismaPatient.update.mockResolvedValue({ id: 'p1' });

      const result = await service.remove('p1', {
        organizationId: ORG_ID,
        userId: USER_ID,
      });

      expect(prismaPatient.update).toHaveBeenCalledTimes(1);
      const updateCalls = prismaPatient.update.mock.calls as Array<
        [
          {
            where: { id: string };
            data: { deletedAt: unknown };
            select: { id: true };
          },
        ]
      >;
      const updateCall = updateCalls[0]?.[0];
      expect(updateCall.where).toEqual({ id: 'p1' });
      expect(updateCall.select).toEqual({ id: true });
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
      expect(prismaPatient.delete).not.toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PATIENT_DELETED',
          resourceId: 'p1',
          organizationId: ORG_ID,
          userId: USER_ID,
        }),
      );
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('findOwnedPatient (via getById)', () => {
    it('throws 404 when the patient is soft-deleted (findFirst returns null because of deletedAt filter)', async () => {
      prismaPatient.findFirst.mockResolvedValue(null);

      await expect(
        service.getById('missing-id', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaPatient.findFirst).toHaveBeenCalledWith({
        where: { id: 'missing-id', organizationId: ORG_ID, deletedAt: null },
      });
    });
  });

  describe('getDetail()', () => {
    it('aggregates patient, files, notes, ai summaries, and activity', async () => {
      const patient = {
        id: 'p1',
        organizationId: ORG_ID,
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const files = [{ id: 'file-1' }];
      const notes = [{ id: 'note-1' }];
      const aiSummaries = [{ id: 'ai-1' }];
      const activity = [{ id: 'audit-1' }];

      prismaPatient.findFirst.mockResolvedValue(patient);
      listFiles.mockResolvedValue(files);
      listNotes.mockResolvedValue(notes);
      listAiSummaries.mockResolvedValue(aiSummaries);
      listActivity.mockResolvedValue(activity);

      const result = await service.getDetail('p1', ORG_ID);

      expect(result).toEqual({
        patient,
        files,
        notes,
        aiSummaries,
        activity,
      });
      expect(listFiles).toHaveBeenCalledWith('p1', ORG_ID);
      expect(listNotes).toHaveBeenCalledWith('p1', ORG_ID);
      expect(listAiSummaries).toHaveBeenCalledWith('p1', ORG_ID);
      expect(listActivity).toHaveBeenCalledWith(ORG_ID, 'p1');
    });
  });
});
