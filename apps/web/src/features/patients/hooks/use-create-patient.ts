import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsApi } from '../api/patients.api';
import type { CreatePatientInput } from '../types/patient.type';
import { patientsQueryKeys } from './query-keys';

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatientInput) => patientsApi.create(input),
    onSuccess: async () => {
      toast.success('Patient created');
      await queryClient.invalidateQueries({ queryKey: [...patientsQueryKeys.all, 'list'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create patient'));
    },
  });
}
