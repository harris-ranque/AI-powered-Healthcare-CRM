import { useQuery } from '@tanstack/react-query';

import { patientsApi } from '../api/patients.api';
import { patientsQueryKeys } from './query-keys';

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: patientsQueryKeys.detail(id ?? ''),
    queryFn: () => patientsApi.getById(id as string),
    enabled: Boolean(id),
  });
}
