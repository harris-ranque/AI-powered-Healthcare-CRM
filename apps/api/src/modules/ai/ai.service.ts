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
import { AuditService } from '../audit/audit.service';
import { OPENAI_CLIENT } from './ai.client';
import {
  DEFAULT_OPENAI_MODEL,
  MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT,
} from './ai.constants';
import type { MedicalNoteSummaryDto } from './dto/medical-note-summary.dto';

export type SummarizeNoteActor = {
  organizationId: string;
  userId: string;
  patientId?: string;
  noteId?: string;
};

export type MedicalNoteSummaryResult = {
  summary: string;
  tokens: number;
};

const aiSummaryUserSelect = {
  id: true,
  prompt: true,
  response: true,
  tokens: true,
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
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'AI summarization is not configured (OPENAI_API_KEY missing)',
      );
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await this.openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: MEDICAL_NOTE_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: dto.notes },
        ],
      });
    } catch {
      throw new BadGatewayException('Failed to generate summary from AI provider');
    }

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      throw new BadGatewayException('AI provider returned an empty summary');
    }

    const tokens = completion.usage?.total_tokens ?? 0;

    await this.prisma.client.aiRequestLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        patientId: actor.patientId,
        noteId: actor.noteId,
        prompt: dto.notes,
        response: summary,
        tokens,
      },
    });

    return { summary, tokens };
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
