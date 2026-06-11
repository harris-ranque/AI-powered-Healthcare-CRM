'use client';

import { useQuery } from '@tanstack/react-query';

import { billingApi } from '../api/billing.api';
import { billingQueryKeys } from './query-keys';

export function useBillingOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingQueryKeys.organization(),
    queryFn: () => billingApi.getOrganization(),
    enabled: options?.enabled ?? true,
  });
}
