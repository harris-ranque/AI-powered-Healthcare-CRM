import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import OpenAI from 'openai';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OPENAI_CLIENT } from './ai.client';
import {
  AI_SAFETY_DISCLAIMER,
  MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT,
} from './ai.constants';
import { AiService } from './ai.service';

describe('AiService', () => {
  const prisma = {
    client: {
      aiRequestLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
    },
  };

  const auditLog = jest.fn();

  const createCompletion = jest.fn();

  const openai = {
    chat: {
      completions: {
        create: createCompletion,
      },
    },
  } as unknown as OpenAI;

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_MODEL') {
        return 'gpt-4o-mini';
      }
      return undefined;
    }),
  };

  const providers = [
    AiService,
    { provide: OPENAI_CLIENT, useValue: openai },
    { provide: ConfigService, useValue: config },
    { provide: PrismaService, useValue: prisma },
    { provide: AuditService, useValue: { log: auditLog } },
  ];

  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({ providers }).compile();

    service = module.get(AiService);
  });

  it('throws 503 when OpenAI client is not configured', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OPENAI_CLIENT, useValue: null },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    const unconfigured = module.get(AiService);

    await expect(
      unconfigured.summarizeNote(
        { notes: 'Patient reports mild headache.' },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('calls OpenAI with the required system prompt and logs model and cost', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Brief summary of notes.' } }],
      usage: { total_tokens: 42 },
    });

    const result = await service.summarizeNote(
      { notes: 'Patient reports mild headache.' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: 'Patient reports mild headache.' },
        ],
      }),
    );

    expect(prisma.client.aiRequestLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        userId: 'user-1',
        prompt: 'Patient reports mild headache.',
        response: 'Brief summary of notes.',
        tokens: 42,
        model: 'gpt-4o-mini',
        cost: expect.any(Number),
      }),
    });

    expect(result.summary).toContain(AI_SAFETY_DISCLAIMER);
    expect(result.tokens).toBe(42);
  });

  it('generateKeyPoints parses structured JSON into three arrays', async () => {
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              keyFindings: ['Mild headache'],
              actionItems: ['Rest and hydrate'],
              followUpTasks: ['Return in 2 weeks'],
            }),
          },
        },
      ],
      usage: { total_tokens: 55 },
    });

    const result = await service.generateKeyPoints(
      { notes: 'Patient reports mild headache.' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: 'json_object' },
      }),
    );

    expect(result.keyPoints).toEqual({
      keyFindings: ['Mild headache'],
      actionItems: ['Rest and hydrate'],
      followUpTasks: ['Return in 2 weeks'],
    });
    expect(result.tokens).toBe(55);
  });

  it('generateVisitSummary ensures the safety disclaimer is present', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'You had a routine check-up today.' } }],
      usage: { total_tokens: 30 },
    });

    const result = await service.generateVisitSummary(
      { notes: 'Routine visit notes.' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(result.visitSummary).toContain(AI_SAFETY_DISCLAIMER);
    expect(result.tokens).toBe(30);
  });

  it('summarizeAdHoc writes patient-scoped audit when patientId is provided', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Ad-hoc summary.' } }],
      usage: { total_tokens: 30 },
    });

    const result = await service.summarizeAdHoc(
      { notes: 'Visit notes for summary.', patientId: 'patient-1' },
      { organizationId: 'org-1', userId: 'user-1', patientId: 'patient-1' },
    );

    expect(prisma.client.patient.findFirst).toHaveBeenCalledWith({
      where: { id: 'patient-1', organizationId: 'org-1', deletedAt: null },
      select: { id: true },
    });

    expect(auditLog).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
      action: 'AI_SUMMARIZED',
      resource: 'PATIENT',
      resourceId: 'patient-1',
      metadata: {
        patientId: 'patient-1',
        tokens: 30,
        source: 'adhoc',
      },
    });

    expect(result.summary).toContain(AI_SAFETY_DISCLAIMER);
  });

  it('summarizeAdHoc skips audit when patientId is omitted', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Generic summary.' } }],
      usage: { total_tokens: 12 },
    });

    await service.summarizeAdHoc(
      { notes: 'Some notes' },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(prisma.client.patient.findFirst).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });

  it('throws BadGatewayException when AI returns empty content', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: '   ' } }],
      usage: { total_tokens: 10 },
    });

    await expect(
      service.summarizeNote(
        { notes: 'Some notes' },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(BadGatewayException);

    expect(prisma.client.aiRequestLog.create).not.toHaveBeenCalled();
  });

  it('throws BadGatewayException when OpenAI request fails', async () => {
    createCompletion.mockRejectedValue(new Error('network error'));

    await expect(
      service.summarizeNote(
        { notes: 'Some notes' },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(BadGatewayException);
  });
});
