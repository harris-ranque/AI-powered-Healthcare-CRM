'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminHealth(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.health(),
    queryFn: () => adminApi.getHealth(),
    enabled: options?.enabled ?? true,
    refetchInterval: 30_000,
  });
}
