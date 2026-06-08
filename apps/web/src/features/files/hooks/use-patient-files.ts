import { useQuery } from '@tanstack/react-query';

import { filesApi } from '../api/files.api';
import { filesQueryKeys } from './query-keys';

export function usePatientFiles(patientId: string | null) {
  return useQuery({
    queryKey: filesQueryKeys.patient(patientId ?? ''),
    queryFn: () => filesApi.listForPatient(patientId as string),
    enabled: Boolean(patientId),
  });
}
