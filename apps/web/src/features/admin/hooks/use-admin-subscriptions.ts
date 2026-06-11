'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminSubscriptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptions(),
    queryFn: () => adminApi.getSubscriptions(),
    enabled: options?.enabled ?? true,
  });
}
