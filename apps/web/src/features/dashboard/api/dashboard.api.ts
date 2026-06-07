import { api } from '@/lib/api/client';

import type {
  ActivityEvent,
  DashboardAnalytics,
  DashboardStats,
} from '../types/dashboard.type';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
  getActivity: async (): Promise<ActivityEvent[]> => {
    const response = await api.get<ActivityEvent[]>('/dashboard/activity');
    return response.data;
  },
  getAnalytics: async (days = 30): Promise<DashboardAnalytics> => {
    const response = await api.get<DashboardAnalytics>('/dashboard/analytics', {
      params: { days },
    });
    return response.data;
  },
};
