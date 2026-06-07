import type {
  SearchAppointmentResult,
  SearchFileResult,
  SearchNoteResult,
  SearchPatientResult,
} from '../types/search.type';

export function getPatientSearchHref(patient: SearchPatientResult): string {
  return `/dashboard/patients/${patient.id}`;
}

export function getNoteSearchHref(note: SearchNoteResult): string {
  return `/dashboard/patients/${note.patientId}?tab=notes`;
}

export function getFileSearchHref(file: SearchFileResult): string {
  if (!file.patientId) {
    return '/dashboard/patients';
  }
  return `/dashboard/patients/${file.patientId}?tab=files`;
}

export function getAppointmentSearchHref(
  appointment: SearchAppointmentResult,
): string {
  return `/dashboard/calendar?appointmentId=${appointment.id}`;
}
