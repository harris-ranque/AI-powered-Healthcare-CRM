import type { ActivityEvent } from '@/features/activity/types/activity.type';

export type DashboardStats = {
  patients: number;
  files: number;
  aiSummaries: number;
  appointmentsToday: number;
};

export type { ActivityEvent };
