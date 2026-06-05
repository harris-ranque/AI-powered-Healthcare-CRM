export const activityQueryKeys = {
  all: ['activity'] as const,
  patient: (patientId: string) => [...activityQueryKeys.all, 'patient', patientId] as const,
};
