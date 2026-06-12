import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';

import { COPILOT_SYSTEM_PROMPT } from './copilot.constants';

export type CopilotContextInput = {
  organizationId: string;
  userMessage: string;
  permissions: string[];
};

type PatientCandidate = {
  id: string;
  firstName: string;
  lastName: string;
};

type PatientActivitySnapshot = {
  patientName: string;
  appointmentsThisMonth: number;
  uploadedFiles: number;
  mriOrImagingFiles: number;
  clinicalNotes: number;
  lastVisit: string | null;
};

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatVisitDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

@Injectable()
export class CopilotContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildSystemPrompt(input: CopilotContextInput): Promise<string> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: input.organizationId },
      select: { name: true, description: true },
    });

    const permissionSet = new Set(input.permissions);
    const canReadPatients = permissionSet.has(Permission.PATIENT_READ);
    const canReadAppointments = permissionSet.has(Permission.APPOINTMENT_READ);
    const canReadFiles = permissionSet.has(Permission.FILE_READ);

    const clinicName = organization?.name ?? 'the clinic';
    const clinicDescription = organization?.description?.trim();

    let patientBlock = 'No specific patient was identified in the user message.';

    if (canReadPatients) {
      const matches = await this.findPatientsInMessage(
        input.organizationId,
        input.userMessage,
      );

      if (matches.length === 1) {
        const snapshot = await this.buildPatientSnapshot(
          matches[0],
          input.organizationId,
          {
            canReadAppointments,
            canReadFiles,
            canReadPatients,
          },
        );
        patientBlock = this.formatPatientSnapshot(snapshot);
      } else if (matches.length > 1) {
        const names = matches
          .map((patient) => `${patient.firstName} ${patient.lastName}`)
          .join(', ');
        patientBlock = `Multiple patients match the message: ${names}. Ask the user which patient they mean before giving patient-specific facts.`;
      }
    } else {
      patientBlock =
        'The user does not have permission to read patient records. Answer without patient-specific data.';
    }

    return `${COPILOT_SYSTEM_PROMPT}

Organization context:
- Clinic name: ${clinicName}
${clinicDescription ? `- About: ${clinicDescription}` : ''}

Patient context:
${patientBlock}`;
  }

  private async findPatientsInMessage(
    organizationId: string,
    userMessage: string,
  ): Promise<PatientCandidate[]> {
    const normalizedMessage = userMessage.toLowerCase();

    const patients = await this.prisma.client.patient.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
      take: 200,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return normalizedMessage.includes(fullName);
    });
  }

  private async buildPatientSnapshot(
    patient: PatientCandidate,
    organizationId: string,
    access: {
      canReadAppointments: boolean;
      canReadFiles: boolean;
      canReadPatients: boolean;
    },
  ): Promise<PatientActivitySnapshot> {
    const monthStart = startOfUtcMonth(new Date());
    const now = new Date();
    const patientName = `${patient.firstName} ${patient.lastName}`;

    const [appointmentsThisMonth, uploadedFiles, mriOrImagingFiles, clinicalNotes, lastVisit] =
      await Promise.all([
        access.canReadAppointments
          ? this.prisma.client.appointment.count({
              where: {
                organizationId,
                patientId: patient.id,
                startsAt: { gte: monthStart },
              },
            })
          : Promise.resolve(0),
        access.canReadFiles
          ? this.prisma.client.file.count({
              where: { organizationId, patientId: patient.id },
            })
          : Promise.resolve(0),
        access.canReadFiles
          ? this.prisma.client.file.count({
              where: {
                organizationId,
                patientId: patient.id,
                OR: [
                  { mimeType: { startsWith: 'image/' } },
                  { mimeType: 'application/pdf' },
                  { originalName: { contains: 'mri', mode: 'insensitive' } },
                ],
              },
            })
          : Promise.resolve(0),
        access.canReadPatients
          ? this.prisma.client.clinicalNote.count({
              where: { organizationId, patientId: patient.id },
            })
          : Promise.resolve(0),
        access.canReadAppointments
          ? this.resolveLastVisit(organizationId, patient.id, now)
          : Promise.resolve(null),
      ]);

    return {
      patientName,
      appointmentsThisMonth,
      uploadedFiles,
      mriOrImagingFiles,
      clinicalNotes,
      lastVisit,
    };
  }

  private async resolveLastVisit(
    organizationId: string,
    patientId: string,
    now: Date,
  ): Promise<string | null> {
    const completed = await this.prisma.client.appointment.findFirst({
      where: {
        organizationId,
        patientId,
        status: AppointmentStatus.COMPLETED,
      },
      orderBy: { startsAt: 'desc' },
      select: { startsAt: true },
    });

    if (completed) {
      return formatVisitDate(completed.startsAt);
    }

    const past = await this.prisma.client.appointment.findFirst({
      where: {
        organizationId,
        patientId,
        startsAt: { lt: now },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
      orderBy: { startsAt: 'desc' },
      select: { startsAt: true },
    });

    return past ? formatVisitDate(past.startsAt) : null;
  }

  private formatPatientSnapshot(snapshot: PatientActivitySnapshot): string {
    const lines = [
      `Patient context — ${snapshot.patientName}:`,
      `- Appointments this month: ${snapshot.appointmentsThisMonth}`,
      `- Uploaded files: ${snapshot.uploadedFiles}${
        snapshot.mriOrImagingFiles > 0
          ? ` (including ${snapshot.mriOrImagingFiles} imaging/MRI-related file(s))`
          : ''
      }`,
      `- Clinical notes: ${snapshot.clinicalNotes}`,
      `- Last visit: ${snapshot.lastVisit ?? 'No recorded visits'}`,
    ];

    return lines.join('\n');
  }
}
