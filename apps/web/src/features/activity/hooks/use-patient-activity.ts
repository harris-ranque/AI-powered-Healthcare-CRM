import { useQuery } from '@tanstack/react-query';

import { activityApi } from '../api/activity.api';
import { activityQueryKeys } from './query-keys';

export function usePatientActivity(patientId: string | null) {
  return useQuery({
    queryKey: activityQueryKeys.patient(patientId ?? ''),
    queryFn: () => activityApi.listForPatient(patientId as string),
    enabled: Boolean(patientId),
  });
}
