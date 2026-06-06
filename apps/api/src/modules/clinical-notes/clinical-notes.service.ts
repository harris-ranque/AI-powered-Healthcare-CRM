import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ClinicalNote } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';

import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';

export type NoteActor = {
  organizationId: string;
  userId: string;
};

const noteInclude = {
  author: { select: { id: true, name: true, email: true } },
} as const;

export type ClinicalNoteWithAuthor = Prisma.ClinicalNoteGetPayload<{
  include: typeof noteInclude;
}>;

@Injectable()
export class ClinicalNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly aiService: AiService,
  ) {}

  async listForPatient(
    patientId: string,
    organizationId: string,
    search?: string,
  ): Promise<ClinicalNoteWithAuthor[]> {
    await this.assertPatientInOrg(patientId, organizationId);

    const trimmedSearch = search?.trim();
    const where: Prisma.ClinicalNoteWhereInput = {
      patientId,
      organizationId,
      ...(trimmedSearch
        ? {
            OR: [
              {
                title: { contains: trimmedSearch, mode: 'insensitive' },
              },
              {
                body: { contains: trimmedSearch, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    return this.prisma.client.clinicalNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: noteInclude,
    });
  }

  async getById(
    noteId: string,
    organizationId: string,
  ): Promise<ClinicalNoteWithAuthor> {
    const note = await this.prisma.client.clinicalNote.findFirst({
      where: { id: noteId, organizationId },
      include: noteInclude,
    });
    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }
    return note;
  }

  async create(
    patientId: string,
    dto: CreateClinicalNoteDto,
    actor: NoteActor,
  ): Promise<ClinicalNote> {
    await this.assertPatientInOrg(patientId, actor.organizationId);

    const note = await this.prisma.client.clinicalNote.create({
      data: {
        organizationId: actor.organizationId,
        patientId,
        authorId: actor.userId,
        title: dto.title ?? null,
        body: dto.body,
      },
      include: noteInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'NOTE_CREATED',
      resource: 'NOTE',
      resourceId: note.id,
      metadata: { patientId },
    });

    return note;
  }

  async update(
    noteId: string,
    dto: UpdateClinicalNoteDto,
    actor: NoteActor,
  ): Promise<ClinicalNote> {
    const existing = await this.findOwnedNote(noteId, actor.organizationId);

    const data: Prisma.ClinicalNoteUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.body !== undefined) {
      data.body = dto.body;
    }

    const note = await this.prisma.client.clinicalNote.update({
      where: { id: existing.id },
      data,
      include: noteInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'NOTE_UPDATED',
      resource: 'NOTE',
      resourceId: note.id,
      metadata: { patientId: note.patientId },
    });

    return note;
  }

  async remove(noteId: string, actor: NoteActor): Promise<{ id: string }> {
    const existing = await this.findOwnedNote(noteId, actor.organizationId);

    await this.prisma.client.clinicalNote.delete({
      where: { id: existing.id },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'NOTE_DELETED',
      resource: 'NOTE',
      resourceId: existing.id,
      metadata: { patientId: existing.patientId },
    });

    return { id: existing.id };
  }

  async summarize(noteId: string, actor: NoteActor) {
    const note = await this.findOwnedNote(noteId, actor.organizationId);

    const result = await this.aiService.summarizeNote(
      { notes: note.body },
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        patientId: note.patientId,
        noteId: note.id,
      },
    );

    const updated = await this.prisma.client.clinicalNote.update({
      where: { id: note.id },
      data: { aiSummary: result.summary },
      include: noteInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'AI_SUMMARIZED',
      resource: 'NOTE',
      resourceId: note.id,
      metadata: { patientId: note.patientId, tokens: result.tokens },
    });

    return { note: updated, ...result };
  }

  async generateKeyPoints(noteId: string, actor: NoteActor) {
    const note = await this.findOwnedNote(noteId, actor.organizationId);

    const result = await this.aiService.generateKeyPoints(
      { notes: note.body },
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        patientId: note.patientId,
        noteId: note.id,
      },
    );

    const updated = await this.prisma.client.clinicalNote.update({
      where: { id: note.id },
      data: { keyPoints: result.keyPoints as Prisma.InputJsonValue },
      include: noteInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'AI_SUMMARIZED',
      resource: 'NOTE',
      resourceId: note.id,
      metadata: {
        patientId: note.patientId,
        tokens: result.tokens,
        source: 'key_points',
      },
    });

    return { note: updated, ...result };
  }

  async generateVisitSummary(noteId: string, actor: NoteActor) {
    const note = await this.findOwnedNote(noteId, actor.organizationId);

    const result = await this.aiService.generateVisitSummary(
      { notes: note.body },
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        patientId: note.patientId,
        noteId: note.id,
      },
    );

    const updated = await this.prisma.client.clinicalNote.update({
      where: { id: note.id },
      data: { visitSummary: result.visitSummary },
      include: noteInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'AI_SUMMARIZED',
      resource: 'NOTE',
      resourceId: note.id,
      metadata: {
        patientId: note.patientId,
        tokens: result.tokens,
        source: 'visit_summary',
      },
    });

    return { note: updated, ...result };
  }

  private async findOwnedNote(noteId: string, organizationId: string) {
    const note = await this.prisma.client.clinicalNote.findFirst({
      where: { id: noteId, organizationId },
    });
    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }
    return note;
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
