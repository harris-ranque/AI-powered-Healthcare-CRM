import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { filesApi } from '../api/files.api';
import { filesQueryKeys } from './query-keys';

export function useDeleteFile(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => filesApi.delete(fileId),
    onSuccess: async () => {
      toast.success('File deleted');
      await queryClient.invalidateQueries({ queryKey: filesQueryKeys.patient(patientId) });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to delete file')),
  });
}
