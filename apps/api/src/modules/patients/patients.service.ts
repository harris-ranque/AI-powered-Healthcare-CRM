import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Patient } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { ClinicalNotesService } from '../clinical-notes/clinical-notes.service';
import { StorageService } from '../storage/storage.service';

import { CreatePatientDto } from './dto/create-patient.dto';
import {
  ListPatientsDto,
  PATIENT_SORT_FIELDS,
  type PatientSortField,
  type PatientSortOrder,
} from './dto/list-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { paginate, type Paginated } from './types/paginated.type';
import type { PatientDetail } from './types/patient-detail.type';

export type PatientActor = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly clinicalNotesService: ClinicalNotesService,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreatePatientDto, actor: PatientActor): Promise<Patient> {
    try {
      const patient = await this.prisma.client.patient.create({
        data: this.toCreateData(dto, actor.organizationId),
      });

      await this.auditService.log({
        userId: actor.userId,
        organizationId: actor.organizationId,
        action: 'PATIENT_CREATED',
        resource: 'PATIENT',
        resourceId: patient.id,
      });

      return patient;
    } catch (error) {
      this.rethrowOnDuplicateEmail(error);
      throw error;
    }
  }

  async list(
    organizationId: string,
    query: ListPatientsDto,
  ): Promise<Paginated<Patient>> {
    const { page, limit, search, includeDeleted, sortBy, order } = query;
    const where: Prisma.PatientWhereInput = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortBy, order);

    const [data, total] = await Promise.all([
      this.prisma.client.patient.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.client.patient.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  getById(id: string, organizationId: string): Promise<Patient> {
    return this.findOwnedPatient(id, organizationId);
  }

  async getDetail(id: string, organizationId: string): Promise<PatientDetail> {
    const patient = await this.findOwnedPatient(id, organizationId);

    const [files, notes, aiSummaries, activity] = await Promise.all([
      this.storageService.listForPatient(id, organizationId),
      this.clinicalNotesService.listForPatient(id, organizationId),
      this.aiService.listForPatient(id, organizationId),
      this.auditService.listForPatient(organizationId, id),
    ]);

    return { patient, files, notes, aiSummaries, activity };
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    actor: PatientActor,
  ): Promise<Patient> {
    await this.findOwnedPatient(id, actor.organizationId);

    try {
      const updated = await this.prisma.client.patient.update({
        where: { id },
        data: this.toUpdateData(dto),
      });

      await this.auditService.log({
        userId: actor.userId,
        organizationId: actor.organizationId,
        action: 'PATIENT_UPDATED',
        resource: 'PATIENT',
        resourceId: updated.id,
      });

      return updated;
    } catch (error) {
      this.rethrowOnDuplicateEmail(error);
      throw error;
    }
  }

  async remove(id: string, actor: PatientActor): Promise<{ id: string }> {
    await this.findOwnedPatient(id, actor.organizationId);

    const deleted = await this.prisma.client.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'PATIENT_DELETED',
      resource: 'PATIENT',
      resourceId: deleted.id,
    });

    return deleted;
  }

  async restore(id: string, actor: PatientActor): Promise<Patient> {
    const existing = await this.findOwnedPatient(id, actor.organizationId, {
      includeDeleted: true,
    });

    if (existing.deletedAt === null) {
      throw new ConflictException('Patient is not deleted');
    }

    try {
      const restored = await this.prisma.client.patient.update({
        where: { id },
        data: { deletedAt: null },
      });

      await this.auditService.log({
        userId: actor.userId,
        organizationId: actor.organizationId,
        action: 'PATIENT_RESTORED',
        resource: 'PATIENT',
        resourceId: restored.id,
      });

      return restored;
    } catch (error) {
      // Possible when another active patient already owns this email in the org
      // (the partial unique index rejects the restore).
      this.rethrowOnDuplicateEmail(error);
      throw error;
    }
  }

  private async findOwnedPatient(
    id: string,
    organizationId: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<Patient> {
    const patient = await this.prisma.client.patient.findFirst({
      where: {
        id,
        organizationId,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  private toCreateData(
    dto: CreatePatientDto,
    organizationId: string,
  ): Prisma.PatientUncheckedCreateInput {
    return {
      organizationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      address: dto.address,
      notes: dto.notes,
    };
  }

  private toUpdateData(dto: UpdatePatientDto): Prisma.PatientUpdateInput {
    const data: Prisma.PatientUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }
    if (dto.email !== undefined) {
      data.email = dto.email;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone;
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }
    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }
    if (dto.address !== undefined) {
      data.address = dto.address;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    return data;
  }

  private buildOrderBy(
    sortBy: PatientSortField,
    order: PatientSortOrder,
  ): Prisma.PatientOrderByWithRelationInput[] {
    // Whitelist sortBy against the known fields before handing it to Prisma so
    // we never interpolate untrusted strings into the orderBy clause, even if
    // the DTO's `@IsIn` validation were ever bypassed.
    const allowed: readonly string[] = PATIENT_SORT_FIELDS;
    const field: PatientSortField = allowed.includes(sortBy)
      ? sortBy
      : 'lastName';
    const direction: PatientSortOrder = order === 'desc' ? 'desc' : 'asc';

    // `id: 'asc'` tie-breaks keep pagination stable when many rows share the
    // same sort value (e.g. identical lastName).
    return [{ [field]: direction }, { id: 'asc' }];
  }

  private rethrowOnDuplicateEmail(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A patient with this email already exists in this organization',
      );
    }
  }
}
