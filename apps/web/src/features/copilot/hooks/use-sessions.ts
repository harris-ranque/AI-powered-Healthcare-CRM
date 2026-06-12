import { useQuery } from '@tanstack/react-query';

import { copilotApi } from '../api/copilot.api';
import { copilotQueryKeys } from './query-keys';

export function useCopilotSessions() {
  return useQuery({
    queryKey: copilotQueryKeys.sessions(),
    queryFn: () => copilotApi.listSessions(),
  });
}
