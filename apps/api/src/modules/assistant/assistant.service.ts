import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssistantMessageRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import {
  DEFAULT_CLINIC_FAQ,
  PATIENT_ASSISTANT_SYSTEM_PROMPT,
} from '../ai/ai.constants';
import { AiService, type ChatMessage } from '../ai/ai.service';
import { AppointmentsService } from '../appointments/appointments.service';

import {
  MAX_ASSISTANT_HISTORY_MESSAGES,
  UPCOMING_APPOINTMENTS_DAYS,
} from './assistant.constants';

export type PatientContext = {
  userId: string;
  patientId: string;
  organizationId: string;
  patientFirstName: string;
  patientLastName: string;
};

const conversationInclude = {
  messages: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async resolvePatientContext(userId: string): Promise<PatientContext> {
    const patient = await this.prisma.client.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
      },
    });

    if (!patient || patient.deletedAt) {
      throw new ForbiddenException('Patient profile not found for this account');
    }

    return {
      userId,
      patientId: patient.id,
      organizationId: patient.organizationId,
      patientFirstName: patient.firstName,
      patientLastName: patient.lastName,
    };
  }

  createConversation(context: PatientContext) {
    return this.prisma.client.assistantConversation.create({
      data: {
        organizationId: context.organizationId,
        patientId: context.patientId,
        userId: context.userId,
      },
      include: conversationInclude,
    });
  }

  listConversations(context: PatientContext) {
    return this.prisma.client.assistantConversation.findMany({
      where: {
        patientId: context.patientId,
        userId: context.userId,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getConversation(conversationId: string, context: PatientContext) {
    const conversation = await this.prisma.client.assistantConversation.findFirst({
      where: {
        id: conversationId,
        patientId: context.patientId,
        userId: context.userId,
      },
      include: conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(conversationId: string, context: PatientContext) {
    const conversation = await this.getConversation(conversationId, context);
    await this.prisma.client.assistantConversation.delete({
      where: { id: conversation.id },
    });
    return { id: conversation.id };
  }

  async *streamAssistantReply(
    conversationId: string,
    content: string,
    context: PatientContext,
  ): AsyncGenerator<string, { messageId: string; content: string }, undefined> {
    const conversation = await this.getConversation(conversationId, context);

    await this.prisma.client.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: AssistantMessageRole.USER,
        content,
      },
    });

    if (!conversation.title) {
      const title = content.trim().slice(0, 60) || 'New conversation';
      await this.prisma.client.assistantConversation.update({
        where: { id: conversation.id },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await this.prisma.client.assistantConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    const systemPrompt = await this.buildSystemPrompt(context);
    const history = this.buildChatHistory(conversation.messages, content);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const generator = this.aiService.streamChat(messages, {
      organizationId: context.organizationId,
      userId: context.userId,
      patientId: context.patientId,
    }, content);

    let result = await generator.next();
    while (!result.done) {
      yield result.value;
      result = await generator.next();
    }

    const assistantContent = result.value.content;

    const assistantMessage = await this.prisma.client.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: AssistantMessageRole.ASSISTANT,
        content: assistantContent,
      },
    });

    return {
      messageId: assistantMessage.id,
      content: assistantContent,
    };
  }

  private async buildSystemPrompt(context: PatientContext): Promise<string> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: context.organizationId },
      select: { name: true, description: true },
    });

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + UPCOMING_APPOINTMENTS_DAYS);

    const appointments = await this.appointmentsService.list(
      context.organizationId,
      {
        patientId: context.patientId,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    );

    const upcoming = appointments
      .filter(
        (appointment) =>
          appointment.status !== 'CANCELLED' &&
          appointment.status !== 'NO_SHOW',
      )
      .slice(0, 5)
      .map((appointment) => {
        const when = new Date(appointment.startsAt).toISOString();
        const label = appointment.title ?? 'Appointment';
        return `- ${label} on ${when} (${appointment.status})`;
      });

    const clinicName = organization?.name ?? 'the clinic';
    const clinicDescription = organization?.description?.trim();
    const appointmentBlock =
      upcoming.length > 0
        ? upcoming.join('\n')
        : '- No upcoming appointments in the next two weeks.';

    return `${PATIENT_ASSISTANT_SYSTEM_PROMPT}

Clinic context:
- Clinic name: ${clinicName}
${clinicDescription ? `- About: ${clinicDescription}` : ''}
- Patient name: ${context.patientFirstName} ${context.patientLastName}

Clinic FAQ:
${DEFAULT_CLINIC_FAQ}

Patient upcoming appointments:
${appointmentBlock}`;
  }

  private buildChatHistory(
    existingMessages: { role: AssistantMessageRole; content: string }[],
    latestUserContent: string,
  ): ChatMessage[] {
    const prior = existingMessages
      .filter((message) => message.content.trim().length > 0)
      .slice(-MAX_ASSISTANT_HISTORY_MESSAGES)
      .map((message) => ({
        role:
          message.role === AssistantMessageRole.USER
            ? ('user' as const)
            : ('assistant' as const),
        content: message.content,
      }));

    const last = prior[prior.length - 1];
    if (last?.role === 'user' && last.content === latestUserContent) {
      return prior;
    }

    return [...prior, { role: 'user' as const, content: latestUserContent }];
  }
}
