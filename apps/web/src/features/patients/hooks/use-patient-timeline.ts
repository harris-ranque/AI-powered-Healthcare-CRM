'use client';

import { useQuery } from '@tanstack/react-query';

import { patientsApi } from '../api/patients.api';
import { patientsQueryKeys } from './query-keys';

export function usePatientTimeline(patientId: string | undefined) {
  return useQuery({
    queryKey: patientsQueryKeys.timeline(patientId ?? ''),
    queryFn: () => patientsApi.getTimeline(patientId!),
    enabled: Boolean(patientId),
  });
}
