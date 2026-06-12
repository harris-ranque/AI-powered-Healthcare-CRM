import { useQuery } from '@tanstack/react-query';

import { copilotApi } from '../api/copilot.api';
import { copilotQueryKeys } from './query-keys';

export function useCopilotSession(sessionId: string | null) {
  return useQuery({
    queryKey: copilotQueryKeys.session(sessionId ?? ''),
    queryFn: () => copilotApi.getSession(sessionId as string),
    enabled: Boolean(sessionId),
  });
}
