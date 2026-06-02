import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Patient } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

export type PatientActor = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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

  list(organizationId: string): Promise<Patient[]> {
    return this.prisma.client.patient.findMany({
      where: { organizationId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  getById(id: string, organizationId: string): Promise<Patient> {
    return this.findOwnedPatient(id, organizationId);
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

    const deleted = await this.prisma.client.patient.delete({
      where: { id },
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

  private async findOwnedPatient(
    id: string,
    organizationId: string,
  ): Promise<Patient> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id, organizationId },
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
