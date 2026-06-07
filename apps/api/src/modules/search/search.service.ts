import { Injectable } from '@nestjs/common';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';

import {
  EMPTY_SEARCH_RESULTS,
  type SearchResults,
} from './search-results.type';

const RESULT_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;

function truncateSnippet(value: string, maxLength = 120): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    organizationId: string,
    query: string,
    permissions: string[],
  ): Promise<SearchResults> {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      return EMPTY_SEARCH_RESULTS;
    }

    const permissionSet = new Set(permissions);
    const canReadPatients = permissionSet.has(Permission.PATIENT_READ);
    const canReadAppointments = permissionSet.has(Permission.APPOINTMENT_READ);
    const canReadFiles = permissionSet.has(Permission.FILE_READ);

    const [patients, appointments, notes, files] = await Promise.all([
      canReadPatients
        ? this.prisma.client.patient.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
            take: RESULT_LIMIT,
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          })
        : Promise.resolve([]),
      canReadAppointments
        ? this.prisma.client.appointment.findMany({
            where: {
              organizationId,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { reason: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              patientId: true,
              title: true,
              startsAt: true,
              status: true,
              patient: {
                select: { firstName: true, lastName: true },
              },
            },
            take: RESULT_LIMIT,
            orderBy: { startsAt: 'desc' },
          })
        : Promise.resolve([]),
      canReadPatients
        ? this.prisma.client.clinicalNote.findMany({
            where: {
              organizationId,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { body: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              patientId: true,
              title: true,
              body: true,
            },
            take: RESULT_LIMIT,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      canReadFiles
        ? this.prisma.client.file.findMany({
            where: {
              organizationId,
              originalName: { contains: q, mode: 'insensitive' },
            },
            select: {
              id: true,
              patientId: true,
              originalName: true,
              mimeType: true,
            },
            take: RESULT_LIMIT,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return {
      patients: patients.map((patient) => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
      })),
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        title: appointment.title,
        startsAt: appointment.startsAt.toISOString(),
        status: appointment.status,
      })),
      notes: notes.map((note) => ({
        id: note.id,
        patientId: note.patientId,
        title: note.title,
        snippet: truncateSnippet(note.body),
      })),
      files: files.map((file) => ({
        id: file.id,
        patientId: file.patientId,
        originalName: file.originalName,
        mimeType: file.mimeType,
      })),
    };
  }
}
