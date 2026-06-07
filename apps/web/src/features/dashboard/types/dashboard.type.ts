import type { ActivityEvent } from '@/features/activity/types/activity.type';

export type DashboardStats = {
  patients: number;
  files: number;
  aiSummaries: number;
  appointmentsToday: number;
};

export type PatientGrowthPoint = {
  date: string;
  newPatients: number;
  cumulative: number;
};

export type AiUsagePoint = {
  date: string;
  requests: number;
};

export type DashboardAnalytics = {
  patientGrowth: PatientGrowthPoint[];
  aiUsage: AiUsagePoint[];
};

export type { ActivityEvent };
