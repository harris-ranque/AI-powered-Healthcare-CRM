import { useQuery } from '@tanstack/react-query';

import { assistantApi } from '../api/assistant.api';
import { assistantQueryKeys } from './query-keys';

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: assistantQueryKeys.conversation(conversationId ?? ''),
    queryFn: () => assistantApi.getConversation(conversationId as string),
    enabled: Boolean(conversationId),
  });
}
