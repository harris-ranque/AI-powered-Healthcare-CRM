import { NotFoundException } from '@nestjs/common';
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
          title: 'Visit note',
          body: 'Test note',
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'note-1',
          patientId: 'patient-1',
          title: 'Visit note',
          body: 'Test note',
          author: { id: 'user-1', name: 'Dr. Smith', email: 'smith@example.com' },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'note-1',
          patientId: 'patient-1',
          title: 'Updated title',
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
    summarizeNote: jest
      .fn()
      .mockResolvedValue({ summary: 'Summary', tokens: 10 }),
    generateKeyPoints: jest.fn().mockResolvedValue({
      keyPoints: {
        keyFindings: ['Headache'],
        actionItems: ['Rest'],
        followUpTasks: ['Follow up in 2 weeks'],
      },
      tokens: 20,
    }),
    generateVisitSummary: jest.fn().mockResolvedValue({
      visitSummary: 'You had a routine visit. Not medical advice. Review before use.',
      tokens: 15,
    }),
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

  it('creates a note with title and audits NOTE_CREATED', async () => {
    await service.create(
      'patient-1',
      { title: 'Visit note', body: 'Test note' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(prisma.client.clinicalNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Visit note',
          body: 'Test note',
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'NOTE_CREATED', resource: 'NOTE' }),
    );
  });

  it('updates title and body independently', async () => {
    await service.update(
      'note-1',
      { title: 'Updated title' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(prisma.client.clinicalNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Updated title' },
      }),
    );
  });

  it('returns a note by id', async () => {
    const result = await service.getById('note-1', 'org-1');

    expect(result).toMatchObject({
      id: 'note-1',
      title: 'Visit note',
      body: 'Test note',
    });
    expect(prisma.client.clinicalNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'note-1', organizationId: 'org-1' },
      }),
    );
  });

  it('throws 404 when note is not found by id', async () => {
    prisma.client.clinicalNote.findFirst.mockResolvedValueOnce(null);

    await expect(service.getById('missing', 'org-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('filters notes by search across title and body', async () => {
    await service.listForPatient('patient-1', 'org-1', 'headache');

    expect(prisma.client.clinicalNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientId: 'patient-1',
          organizationId: 'org-1',
          OR: [
            { title: { contains: 'headache', mode: 'insensitive' } },
            { body: { contains: 'headache', mode: 'insensitive' } },
          ],
        },
      }),
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

  it('generates key points via AiService and saves keyPoints', async () => {
    const result = await service.generateKeyPoints('note-1', {
      organizationId: 'org-1',
      userId: 'user-1',
    });

    expect(aiService.generateKeyPoints).toHaveBeenCalledWith(
      { notes: 'Test note' },
      expect.objectContaining({ patientId: 'patient-1', noteId: 'note-1' }),
    );
    expect(prisma.client.clinicalNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          keyPoints: {
            keyFindings: ['Headache'],
            actionItems: ['Rest'],
            followUpTasks: ['Follow up in 2 weeks'],
          },
        },
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_SUMMARIZED',
        metadata: expect.objectContaining({ source: 'key_points' }),
      }),
    );
    expect(result.keyPoints.keyFindings).toEqual(['Headache']);
  });

  it('generates visit summary via AiService and saves visitSummary', async () => {
    const result = await service.generateVisitSummary('note-1', {
      organizationId: 'org-1',
      userId: 'user-1',
    });

    expect(aiService.generateVisitSummary).toHaveBeenCalledWith(
      { notes: 'Test note' },
      expect.objectContaining({ patientId: 'patient-1', noteId: 'note-1' }),
    );
    expect(prisma.client.clinicalNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          visitSummary:
            'You had a routine visit. Not medical advice. Review before use.',
        },
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_SUMMARIZED',
        metadata: expect.objectContaining({ source: 'visit_summary' }),
      }),
    );
    expect(result.visitSummary).toContain('Not medical advice');
  });
});
