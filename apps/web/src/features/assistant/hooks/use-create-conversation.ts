import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assistantApi } from '../api/assistant.api';
import { assistantQueryKeys } from './query-keys';

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => assistantApi.createConversation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assistantQueryKeys.conversations(),
      });
    },
  });
}
