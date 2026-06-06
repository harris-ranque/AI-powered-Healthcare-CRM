import type { Appointment } from '../types/appointment.type';

export function formatPatientName(
  patient?: Appointment['patient'],
): string {
  if (!patient) return 'Unknown patient';
  return `${patient.firstName} ${patient.lastName}`.trim();
}

export function formatProviderName(
  provider?: Appointment['provider'] | null,
): string {
  if (!provider) return 'Unassigned';
  return provider.name ?? provider.email;
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}

export function isoToDatetimeLocal(iso: string): string {
  return toDatetimeLocalValue(new Date(iso));
}

export function formatAppointmentRange(startsAt: string, endsAt: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${formatter.format(new Date(startsAt))} – ${formatter.format(new Date(endsAt))}`;
}

export function getAppointmentEventTitle(appointment: Appointment): string {
  const patient = formatPatientName(appointment.patient);
  if (appointment.title) {
    return `${patient} · ${appointment.title}`;
  }
  return patient;
}
