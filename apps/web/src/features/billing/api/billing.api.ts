import { api } from '@/lib/api/client';

import type {
  BillingUsageSnapshot,
  CancelSubscriptionResult,
  CheckoutPlan,
  OrganizationBilling,
} from '../types/billing.type';

export const billingApi = {
  getOrganization: async (): Promise<OrganizationBilling> => {
    const response = await api.get<OrganizationBilling>('/organizations/current');
    return response.data;
  },

  getUsage: async (): Promise<BillingUsageSnapshot> => {
    const response = await api.get<BillingUsageSnapshot>('/usage');
    return response.data;
  },

  createCheckout: async (plan: CheckoutPlan): Promise<{ url: string }> => {
    const response = await api.post<{ url: string }>('/stripe/subscription', {
      plan,
    });
    return response.data;
  },

  openPortal: async (): Promise<{ url: string }> => {
    const response = await api.post<{ url: string }>('/stripe/billing-portal');
    return response.data;
  },

  cancelSubscription: async (): Promise<CancelSubscriptionResult> => {
    const response = await api.post<CancelSubscriptionResult>(
      '/stripe/subscription/cancel',
    );
    return response.data;
  },
};
