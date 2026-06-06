import { useQuery } from '@tanstack/react-query';

import { clinicalNotesApi } from '../api/clinical-notes.api';
import { clinicalNotesQueryKeys } from './query-keys';

export function usePatientNotes(
  patientId: string | null,
  search?: string,
) {
  return useQuery({
    queryKey: clinicalNotesQueryKeys.patient(patientId ?? '', search),
    queryFn: () => clinicalNotesApi.list(patientId as string, search),
    enabled: Boolean(patientId),
  });
}
