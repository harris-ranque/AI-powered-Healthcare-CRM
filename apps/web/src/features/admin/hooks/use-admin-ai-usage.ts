'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminAiUsage(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.aiUsage(),
    queryFn: () => adminApi.getAiUsage(),
    enabled: options?.enabled ?? true,
  });
}
