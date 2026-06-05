import { useQuery } from '@tanstack/react-query';

import { clinicalNotesApi } from '../api/clinical-notes.api';
import { clinicalNotesQueryKeys } from './query-keys';

export function usePatientNotes(patientId: string | null) {
  return useQuery({
    queryKey: clinicalNotesQueryKeys.patient(patientId ?? ''),
    queryFn: () => clinicalNotesApi.list(patientId as string),
    enabled: Boolean(patientId),
  });
}
