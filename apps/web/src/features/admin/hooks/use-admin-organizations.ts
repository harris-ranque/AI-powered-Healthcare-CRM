'use client';

import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/admin.api';
import { adminQueryKeys } from './query-keys';

export function useAdminOrganizations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.organizations(),
    queryFn: () => adminApi.getOrganizations(),
    enabled: options?.enabled ?? true,
  });
}
