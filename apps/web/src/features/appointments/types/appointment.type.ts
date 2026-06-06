export const appointmentStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type AppointmentPatient = {
  id: string;
  firstName: string;
  lastName: string;
};

export type AppointmentProvider = {
  id: string;
  name: string | null;
  email: string;
};

export type Appointment = {
  id: string;
  organizationId: string;
  patientId: string;
  providerId: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  title: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: AppointmentPatient;
  provider?: AppointmentProvider | null;
};

export type ListAppointmentsQuery = {
  from?: string;
  to?: string;
  patientId?: string;
  providerId?: string;
  status?: AppointmentStatus;
};

export type CreateAppointmentInput = {
  patientId: string;
  providerId?: string;
  startsAt: string;
  endsAt: string;
  status?: AppointmentStatus;
  title?: string;
  reason?: string;
  notes?: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;
