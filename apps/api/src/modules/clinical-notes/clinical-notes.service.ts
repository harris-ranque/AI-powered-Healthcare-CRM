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
  ): Promise<ClinicalNoteWithAuthor[]> {
    await this.assertPatientInOrg(patientId, organizationId);
    return this.prisma.client.clinicalNote.findMany({
      where: { patientId, organizationId },
      orderBy: { createdAt: 'desc' },
      include: noteInclude,
    });
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

    const note = await this.prisma.client.clinicalNote.update({
      where: { id: existing.id },
      data: { body: dto.body },
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
