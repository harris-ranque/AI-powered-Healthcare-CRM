import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api/dashboard.api';
import { dashboardQueryKeys } from './query-keys';

const DEFAULT_DAYS = 30;

export function useDashboardAnalytics(
  days = DEFAULT_DAYS,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: dashboardQueryKeys.analytics(days),
    queryFn: () => dashboardApi.getAnalytics(days),
    enabled: options?.enabled ?? true,
  });
}
