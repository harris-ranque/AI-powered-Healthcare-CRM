import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsApi } from '../api/patients.api';
import { patientsQueryKeys } from './query-keys';

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: async () => {
      toast.success('Patient deleted');
      await queryClient.invalidateQueries({ queryKey: [...patientsQueryKeys.all, 'list'] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete patient'));
    },
  });
}
