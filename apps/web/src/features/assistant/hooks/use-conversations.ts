import { useQuery } from '@tanstack/react-query';

import { assistantApi } from '../api/assistant.api';
import { assistantQueryKeys } from './query-keys';

export function useConversations() {
  return useQuery({
    queryKey: assistantQueryKeys.conversations(),
    queryFn: () => assistantApi.listConversations(),
  });
}
