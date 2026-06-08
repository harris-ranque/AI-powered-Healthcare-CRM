import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api/dashboard.api';
import { dashboardQueryKeys } from './query-keys';

export function useDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    enabled: options?.enabled ?? true,
  });
}
