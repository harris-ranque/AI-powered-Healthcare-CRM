import { useQuery } from '@tanstack/react-query';

import { clinicalNotesApi } from '../api/clinical-notes.api';
import { clinicalNotesQueryKeys } from './query-keys';

export function usePatientAiSummaries(patientId: string | null) {
  return useQuery({
    queryKey: clinicalNotesQueryKeys.aiSummaries(patientId ?? ''),
    queryFn: () => clinicalNotesApi.listAiSummaries(patientId as string),
    enabled: Boolean(patientId),
  });
}
