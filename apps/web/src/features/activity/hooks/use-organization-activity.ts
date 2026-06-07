import { useQuery } from '@tanstack/react-query';

import { activityApi } from '../api/activity.api';
import { activityQueryKeys } from './query-keys';

export function useOrganizationActivity() {
  return useQuery({
    queryKey: activityQueryKeys.organization(),
    queryFn: () => activityApi.listForOrganization(),
  });
}
