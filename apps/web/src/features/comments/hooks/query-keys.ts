export const commentsQueryKeys = {
  all: ['comments'] as const,
  patient: (patientId: string) =>
    [...commentsQueryKeys.all, 'patient', patientId] as const,
  appointment: (appointmentId: string) =>
    [...commentsQueryKeys.all, 'appointment', appointmentId] as const,
};
