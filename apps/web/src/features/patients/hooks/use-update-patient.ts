import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsApi } from '../api/patients.api';
import type { UpdatePatientInput } from '../types/patient.type';
import { patientsQueryKeys } from './query-keys';

type UpdatePatientVariables = {
  id: string;
  input: UpdatePatientInput;
};

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdatePatientVariables) => patientsApi.update(id, input),
    onSuccess: async (patient) => {
      toast.success('Patient updated');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...patientsQueryKeys.all, 'list'] }),
        queryClient.invalidateQueries({ queryKey: patientsQueryKeys.detail(patient.id) }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update patient'));
    },
  });
}
