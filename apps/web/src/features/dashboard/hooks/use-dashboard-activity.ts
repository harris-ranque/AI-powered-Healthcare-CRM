import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api/dashboard.api';
import { dashboardQueryKeys } from './query-keys';

export function useDashboardActivity() {
  return useQuery({
    queryKey: dashboardQueryKeys.activity(),
    queryFn: () => dashboardApi.getActivity(),
  });
}
