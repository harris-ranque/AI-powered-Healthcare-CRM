'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { billingApi } from '../api/billing.api';
import type { CheckoutPlan } from '../types/billing.type';
import { billingQueryKeys } from './query-keys';

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (plan: CheckoutPlan) => billingApi.createCheckout(plan),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: () => billingApi.openPortal(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingQueryKeys.all });
    },
  });
}
