export const clinicalNotesQueryKeys = {
  all: ['clinical-notes'] as const,
  patient: (patientId: string) =>
    [...clinicalNotesQueryKeys.all, 'patient', patientId] as const,
  aiSummaries: (patientId: string) =>
    [...clinicalNotesQueryKeys.all, 'ai-summaries', patientId] as const,
};
