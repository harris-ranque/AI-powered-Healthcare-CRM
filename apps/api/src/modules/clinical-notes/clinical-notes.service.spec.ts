import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { ClinicalNotesService } from './clinical-notes.service';

describe('ClinicalNotesService', () => {
  const prisma = {
    client: {
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
      clinicalNote: {
        create: jest.fn().mockResolvedValue({
          id: 'note-1',
          patientId: 'patient-1',
          body: 'Test note',
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'note-1',
          patientId: 'patient-1',
          body: 'Test note',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'note-1',
          patientId: 'patient-1',
          body: 'Updated',
          aiSummary: 'Summary',
        }),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };

  const auditService = { log: jest.fn() };
  const aiService = {
    summarizeNote: jest.fn().mockResolvedValue({ summary: 'Summary', tokens: 10 }),
  };

  let service: ClinicalNotesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ClinicalNotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();
    service = module.get(ClinicalNotesService);
  });

  it('creates a note and audits NOTE_CREATED', async () => {
    await service.create(
      'patient-1',
      { body: 'Test note' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(prisma.client.clinicalNote.create).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'NOTE_CREATED', resource: 'NOTE' }),
    );
  });

  it('summarizes a note via AiService and saves aiSummary', async () => {
    const result = await service.summarize('note-1', {
      organizationId: 'org-1',
      userId: 'user-1',
    });

    expect(aiService.summarizeNote).toHaveBeenCalledWith(
      { notes: 'Test note' },
      expect.objectContaining({ patientId: 'patient-1', noteId: 'note-1' }),
    );
    expect(prisma.client.clinicalNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { aiSummary: 'Summary' },
      }),
    );
    expect(result.summary).toBe('Summary');
  });
});
