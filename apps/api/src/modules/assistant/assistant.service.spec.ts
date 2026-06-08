import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AssistantMessageRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  const prisma = {
    client: {
      patient: { findUnique: jest.fn() },
      organization: { findUnique: jest.fn() },
      assistantConversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      assistantMessage: {
        create: jest.fn(),
      },
    },
  };

  const aiService = {
    streamChat: jest.fn(),
  };

  const appointmentsService = {
    list: jest.fn().mockResolvedValue([]),
  };

  let service: AssistantService;

  const context = {
    userId: 'user-1',
    patientId: 'patient-1',
    organizationId: 'org-1',
    patientFirstName: 'Jane',
    patientLastName: 'Doe',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AssistantService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
        { provide: AppointmentsService, useValue: appointmentsService },
      ],
    }).compile();

    service = module.get(AssistantService);
  });

  describe('resolvePatientContext()', () => {
    it('returns patient context for linked profile', async () => {
      prisma.client.patient.findUnique.mockResolvedValue({
        id: 'patient-1',
        organizationId: 'org-1',
        firstName: 'Jane',
        lastName: 'Doe',
        deletedAt: null,
      });

      await expect(service.resolvePatientContext('user-1')).resolves.toEqual(context);
    });

    it('throws when patient profile is missing', async () => {
      prisma.client.patient.findUnique.mockResolvedValue(null);

      await expect(service.resolvePatientContext('user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('listConversations()', () => {
    it('scopes conversations to patient and user', async () => {
      prisma.client.assistantConversation.findMany.mockResolvedValue([]);

      await service.listConversations(context);

      expect(prisma.client.assistantConversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'patient-1', userId: 'user-1' },
        }),
      );
    });
  });

  describe('streamAssistantReply()', () => {
    it('persists user and assistant messages', async () => {
      prisma.client.assistantConversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        title: null,
        messages: [],
      });
      prisma.client.assistantMessage.create
        .mockResolvedValueOnce({ id: 'msg-user' })
        .mockResolvedValueOnce({ id: 'msg-assistant' });
      prisma.client.assistantConversation.update.mockResolvedValue({});
      prisma.client.organization.findUnique.mockResolvedValue({
        name: 'Sunrise Medical',
        description: 'Primary care clinic',
      });

      async function* mockStream() {
        yield 'Hello';
        yield ' there';
        return { tokens: 10, model: 'gpt-4o-mini', content: 'Hello there' };
      }

      aiService.streamChat.mockReturnValue(mockStream());

      const generator = service.streamAssistantReply(
        'conv-1',
        'I have a headache',
        context,
      );

      const tokens: string[] = [];
      let result = await generator.next();
      while (!result.done) {
        tokens.push(result.value);
        result = await generator.next();
      }

      expect(tokens).toEqual(['Hello', ' there']);
      expect(result.value).toEqual({
        messageId: 'msg-assistant',
        content: 'Hello there',
      });
      expect(prisma.client.assistantMessage.create).toHaveBeenCalledTimes(2);
      expect(prisma.client.assistantMessage.create).toHaveBeenNthCalledWith(1, {
        data: {
          conversationId: 'conv-1',
          role: AssistantMessageRole.USER,
          content: 'I have a headache',
        },
      });
    });
  });

  describe('getConversation()', () => {
    it('throws when conversation is not owned by patient', async () => {
      prisma.client.assistantConversation.findFirst.mockResolvedValue(null);

      await expect(
        service.getConversation('conv-1', context),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
