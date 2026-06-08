export const clinicalNotesQueryKeys = {
  all: ['clinical-notes'] as const,
  patient: (patientId: string, search?: string) =>
    [...clinicalNotesQueryKeys.all, 'patient', patientId, search ?? ''] as const,
  detail: (noteId: string) =>
    [...clinicalNotesQueryKeys.all, 'detail', noteId] as const,
  aiSummaries: (patientId: string) =>
    [...clinicalNotesQueryKeys.all, 'ai-summaries', patientId] as const,
};
