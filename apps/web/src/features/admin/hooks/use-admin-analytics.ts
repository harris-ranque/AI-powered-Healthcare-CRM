'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.analytics(),
    queryFn: () => adminApi.getAnalytics(),
    enabled: options?.enabled ?? true,
  });
}
