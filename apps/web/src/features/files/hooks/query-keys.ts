export const filesQueryKeys = {
  all: ['files'] as const,
  patient: (patientId: string) => [...filesQueryKeys.all, 'patient', patientId] as const,
};
