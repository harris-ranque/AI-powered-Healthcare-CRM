'use client';

import { useQuery } from '@tanstack/react-query';

import { billingApi } from '../api/billing.api';
import { billingQueryKeys } from './query-keys';

export function useBillingUsage(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingQueryKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    enabled: options?.enabled ?? true,
  });
}
