import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AiService, type ChatMessage } from '../ai/ai.service';

import { CopilotContextService } from './copilot-context.service';
import { MAX_COPILOT_HISTORY_MESSAGES } from './copilot.constants';

export type CopilotActor = {
  organizationId: string;
  userId: string;
  permissions: string[];
};

const sessionInclude = {
  messages: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly copilotContextService: CopilotContextService,
  ) {}

  createSession(actor: CopilotActor) {
    return this.prisma.client.chatSession.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
      },
      include: sessionInclude,
    });
  }

  listSessions(actor: CopilotActor) {
    return this.prisma.client.chatSession.findMany({
      where: {
        organizationId: actor.organizationId,
        userId: actor.userId,
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

  async getSession(sessionId: string, actor: CopilotActor) {
    const session = await this.prisma.client.chatSession.findFirst({
      where: {
        id: sessionId,
        organizationId: actor.organizationId,
        userId: actor.userId,
      },
      include: sessionInclude,
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return session;
  }

  async deleteSession(sessionId: string, actor: CopilotActor) {
    const session = await this.getSession(sessionId, actor);
    await this.prisma.client.chatSession.delete({
      where: { id: session.id },
    });
    return { id: session.id };
  }

  async *streamCopilotReply(
    sessionId: string,
    content: string,
    actor: CopilotActor,
  ): AsyncGenerator<string, { messageId: string; content: string }, undefined> {
    const session = await this.getSession(sessionId, actor);

    await this.prisma.client.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
      },
    });

    if (!session.title) {
      const title = content.trim().slice(0, 60) || 'New conversation';
      await this.prisma.client.chatSession.update({
        where: { id: session.id },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await this.prisma.client.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });
    }

    const systemPrompt = await this.copilotContextService.buildSystemPrompt({
      organizationId: actor.organizationId,
      userMessage: content,
      permissions: actor.permissions,
    });

    const history = this.buildChatHistory(session.messages, content);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const generator = this.aiService.streamChat(
      messages,
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
      },
      content,
    );

    let result = await generator.next();
    while (!result.done) {
      yield result.value;
      result = await generator.next();
    }

    const assistantContent = result.value.content;

    const assistantMessage = await this.prisma.client.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: assistantContent,
      },
    });

    return {
      messageId: assistantMessage.id,
      content: assistantContent,
    };
  }

  private buildChatHistory(
    existingMessages: { role: string; content: string }[],
    latestUserContent: string,
  ): ChatMessage[] {
    const prior = existingMessages
      .filter((message) => message.content.trim().length > 0)
      .slice(-MAX_COPILOT_HISTORY_MESSAGES)
      .map((message) => ({
        role:
          message.role === 'user'
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
