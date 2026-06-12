import { useMutation, useQueryClient } from '@tanstack/react-query';

import { copilotApi } from '../api/copilot.api';
import { copilotQueryKeys } from './query-keys';

export function useCreateCopilotSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => copilotApi.createSession(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: copilotQueryKeys.sessions(),
      });
    },
  });
}
