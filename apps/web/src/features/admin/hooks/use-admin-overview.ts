'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.overview(),
    queryFn: () => adminApi.getOverview(),
    enabled: options?.enabled ?? true,
  });
}
