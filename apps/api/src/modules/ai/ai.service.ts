import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { BillingService } from '../billing/billing.service';
import { UsageMetric } from '../usage-tracking/usage-metric.constants';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { AuditService } from '../audit/audit.service';
import { OPENAI_CLIENT } from './ai.client';
import {
  AI_SAFETY_DISCLAIMER,
  DEFAULT_MODEL_PRICING_PER_1K,
  DEFAULT_OPENAI_MODEL,
  KEY_POINTS_SYSTEM_PROMPT,
  MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT,
  MODEL_PRICING,
  VISIT_SUMMARY_SYSTEM_PROMPT,
} from './ai.constants';
import type { MedicalNoteSummaryDto } from './dto/medical-note-summary.dto';

export type SummarizeNoteActor = {
  organizationId: string;
  userId: string;
  patientId?: string;
  noteId?: string;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type StreamChatResult = {
  tokens: number;
  model: string;
  content: string;
};

export type MedicalNoteSummaryResult = {
  summary: string;
  tokens: number;
};

export type KeyPoints = {
  keyFindings: string[];
  actionItems: string[];
  followUpTasks: string[];
};

export type KeyPointsResult = {
  keyPoints: KeyPoints;
  tokens: number;
};

export type VisitSummaryResult = {
  visitSummary: string;
  tokens: number;
};

type CompletionResult = {
  content: string;
  tokens: number;
  model: string;
};

const aiSummaryUserSelect = {
  id: true,
  prompt: true,
  response: true,
  tokens: true,
  model: true,
  cost: true,
  noteId: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

export type AiSummaryWithUser = Prisma.AiRequestLogGetPayload<{
  select: typeof aiSummaryUserSelect;
}>;

@Injectable()
export class AiService {
  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI | null,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly auditService: AuditService,
  ) {}

  async summarizeAdHoc(
    dto: MedicalNoteSummaryDto,
    actor: SummarizeNoteActor,
  ): Promise<MedicalNoteSummaryResult> {
    if (actor.patientId) {
      await this.assertPatientInOrg(actor.patientId, actor.organizationId);
    }

    const result = await this.summarizeNote(dto, actor);

    if (actor.patientId) {
      await this.auditService.log({
        userId: actor.userId,
        organizationId: actor.organizationId,
        action: 'AI_SUMMARIZED',
        resource: 'PATIENT',
        resourceId: actor.patientId,
        metadata: {
          patientId: actor.patientId,
          tokens: result.tokens,
          source: 'adhoc',
        },
      });
    }

    return result;
  }

  async summarizeNote(
    dto: MedicalNoteSummaryDto,
    actor: SummarizeNoteActor,
  ): Promise<MedicalNoteSummaryResult> {
    const { content, tokens } = await this.runCompletion({
      system: MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT,
      user: dto.notes,
      actor,
      prompt: dto.notes,
    });

    const summary = this.ensureDisclaimer(content);

    return { summary, tokens };
  }

  async generateKeyPoints(
    dto: MedicalNoteSummaryDto,
    actor: SummarizeNoteActor,
  ): Promise<KeyPointsResult> {
    const { content, tokens } = await this.runCompletion({
      system: KEY_POINTS_SYSTEM_PROMPT,
      user: dto.notes,
      actor,
      prompt: dto.notes,
      json: true,
    });

    const keyPoints = this.parseKeyPoints(content);

    return { keyPoints, tokens };
  }

  async generateVisitSummary(
    dto: MedicalNoteSummaryDto,
    actor: SummarizeNoteActor,
  ): Promise<VisitSummaryResult> {
    const { content, tokens } = await this.runCompletion({
      system: VISIT_SUMMARY_SYSTEM_PROMPT,
      user: dto.notes,
      actor,
      prompt: dto.notes,
    });

    const visitSummary = this.ensureDisclaimer(content);

    return { visitSummary, tokens };
  }

  async *streamChat(
    messages: ChatMessage[],
    actor: SummarizeNoteActor,
    promptForLog: string,
  ): AsyncGenerator<string, StreamChatResult, undefined> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'AI assistant is not configured (OPENAI_API_KEY missing)',
      );
    }

    await this.billingService.assertCanUseAi(actor.organizationId);

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;

    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    try {
      stream = await this.openai.chat.completions.create({
        model,
        temperature: 0.3,
        stream: true,
        stream_options: { include_usage: true },
        messages,
      });
    } catch {
      throw new BadGatewayException(
        'Failed to generate response from AI provider',
      );
    }

    let content = '';
    let tokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        content += delta;
        yield delta;
      }
      if (chunk.usage) {
        if (chunk.usage.total_tokens) {
          tokens = chunk.usage.total_tokens;
        }
        if (chunk.usage.prompt_tokens) {
          promptTokens = chunk.usage.prompt_tokens;
        }
        if (chunk.usage.completion_tokens) {
          completionTokens = chunk.usage.completion_tokens;
        }
      }
    }

    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadGatewayException('AI provider returned an empty response');
    }

    const cost = this.estimateCost(model, tokens);

    await this.prisma.client.aiRequestLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        patientId: actor.patientId,
        prompt: promptForLog,
        response: trimmed,
        tokens,
        promptTokens,
        completionTokens,
        model,
        cost,
      },
    });

    void this.usageTrackingService.increment(
      actor.organizationId,
      UsageMetric.AI_REQUESTS,
    );

    return { tokens, model, content: trimmed };
  }

  async listForPatient(
    patientId: string,
    organizationId: string,
  ): Promise<AiSummaryWithUser[]> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id: patientId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.client.aiRequestLog.findMany({
      where: { patientId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: aiSummaryUserSelect,
    });
  }

  private async runCompletion(params: {
    system: string;
    user: string;
    actor: SummarizeNoteActor;
    prompt: string;
    json?: boolean;
  }): Promise<CompletionResult> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'AI summarization is not configured (OPENAI_API_KEY missing)',
      );
    }

    await this.billingService.assertCanUseAi(params.actor.organizationId);

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await this.openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
        ...(params.json
          ? { response_format: { type: 'json_object' as const } }
          : {}),
      });
    } catch {
      throw new BadGatewayException(
        'Failed to generate summary from AI provider',
      );
    }

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new BadGatewayException('AI provider returned an empty summary');
    }

    const tokens = completion.usage?.total_tokens ?? 0;
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const cost = this.estimateCost(model, tokens);

    await this.prisma.client.aiRequestLog.create({
      data: {
        organizationId: params.actor.organizationId,
        userId: params.actor.userId,
        patientId: params.actor.patientId,
        noteId: params.actor.noteId,
        prompt: params.prompt,
        response: content,
        tokens,
        promptTokens,
        completionTokens,
        model,
        cost,
      },
    });

    void this.usageTrackingService.increment(
      params.actor.organizationId,
      UsageMetric.AI_REQUESTS,
    );

    return { content, tokens, model };
  }

  private estimateCost(model: string, tokens: number): number {
    const rate = MODEL_PRICING[model] ?? DEFAULT_MODEL_PRICING_PER_1K;
    return (tokens / 1000) * rate;
  }

  private ensureDisclaimer(text: string): string {
    if (text.includes(AI_SAFETY_DISCLAIMER)) {
      return text;
    }
    return `${text.trim()}\n\n${AI_SAFETY_DISCLAIMER}`;
  }

  private parseKeyPoints(content: string): KeyPoints {
    try {
      const parsed = JSON.parse(content) as Partial<KeyPoints>;
      return {
        keyFindings: this.toStringArray(parsed.keyFindings),
        actionItems: this.toStringArray(parsed.actionItems),
        followUpTasks: this.toStringArray(parsed.followUpTasks),
      };
    } catch {
      throw new BadGatewayException(
        'AI provider returned invalid key points JSON',
      );
    }
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async assertPatientInOrg(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id: patientId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
  }
}
