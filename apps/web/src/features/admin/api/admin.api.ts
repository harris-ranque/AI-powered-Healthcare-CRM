import { api } from '@/lib/api/client';

import type {
  AdminAiUsage,
  AdminAnalytics,
  AdminHealth,
  AdminOrganizationRow,
  AdminOverview,
  AdminSubscriptionSummary,
} from '../types/admin.type';

export const adminApi = {
  getOverview: async (): Promise<AdminOverview> => {
    const response = await api.get<AdminOverview>('/admin/overview');
    return response.data;
  },

  getOrganizations: async (): Promise<AdminOrganizationRow[]> => {
    const response = await api.get<AdminOrganizationRow[]>('/admin/organizations');
    return response.data;
  },

  getSubscriptions: async (): Promise<AdminSubscriptionSummary> => {
    const response = await api.get<AdminSubscriptionSummary>('/admin/subscriptions');
    return response.data;
  },

  getAiUsage: async (): Promise<AdminAiUsage> => {
    const response = await api.get<AdminAiUsage>('/admin/ai-usage');
    return response.data;
  },

  getHealth: async (): Promise<AdminHealth> => {
    const response = await api.get<AdminHealth>('/admin/health');
    return response.data;
  },

  getAnalytics: async (): Promise<AdminAnalytics> => {
    const response = await api.get<AdminAnalytics>('/admin/analytics');
    return response.data;
  },
};
