import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsQueryKeys } from '@/features/patients/hooks/query-keys';

import { clinicalNotesApi } from '../api/clinical-notes.api';

export function useSummarizeText(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notes: string) =>
      clinicalNotesApi.summarizeText({ notes, patientId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to generate summary')),
  });
}
