import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import OpenAI from 'openai';

import { PrismaService } from '../../database/prisma.service';
import { OPENAI_CLIENT } from './ai.client';
import { MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT } from './ai.constants';
import { AiService } from './ai.service';

describe('AiService', () => {
  const prisma = {
    client: {
      aiRequestLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    },
  };

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

  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OPENAI_CLIENT, useValue: openai },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AiService);
  });

  it('throws 503 when OpenAI client is not configured', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OPENAI_CLIENT, useValue: null },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
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

  it('calls OpenAI with the required system prompt and logs the request', async () => {
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
      data: {
        organizationId: 'org-1',
        userId: 'user-1',
        prompt: 'Patient reports mild headache.',
        response: 'Brief summary of notes.',
        tokens: 42,
      },
    });

    expect(result).toEqual({ summary: 'Brief summary of notes.', tokens: 42 });
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
