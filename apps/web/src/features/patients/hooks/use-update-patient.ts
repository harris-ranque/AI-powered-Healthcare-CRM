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
      await queryClient.invalidateQueries({ queryKey: [...patientsQueryKeys.all, 'list'] });
      queryClient.setQueryData(patientsQueryKeys.detail(patient.id), patient);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update patient'));
    },
  });
}
