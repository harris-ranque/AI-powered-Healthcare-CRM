import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { patientsApi } from '../api/patients.api';
import { listPatientsQuerySchema } from '../schemas/patient.schema';
import type { ListPatientsQuery } from '../types/patient.type';
import { patientsQueryKeys } from './query-keys';

export function usePatientsList(query: ListPatientsQuery) {
  const normalized = listPatientsQuerySchema.parse(query);

  return useQuery({
    queryKey: patientsQueryKeys.list(normalized),
    queryFn: () => patientsApi.list(normalized),
    placeholderData: keepPreviousData,
  });
}
