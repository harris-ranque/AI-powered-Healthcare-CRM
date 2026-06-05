import { api } from '@/lib/api/client';

import type { ActivityEvent, DashboardStats } from '../types/dashboard.type';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
  getActivity: async (): Promise<ActivityEvent[]> => {
    const response = await api.get<ActivityEvent[]>('/dashboard/activity');
    return response.data;
  },
};
