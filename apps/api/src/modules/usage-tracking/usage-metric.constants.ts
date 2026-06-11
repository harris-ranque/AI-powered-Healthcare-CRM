export const UsageMetric = {
  PATIENTS: 'patients',
  USERS: 'users',
  AI_REQUESTS: 'ai_requests',
  STORAGE_BYTES: 'storage_bytes',
  APPOINTMENTS: 'appointments',
} as const;

export type UsageMetricKey = (typeof UsageMetric)[keyof typeof UsageMetric];

export const ALL_USAGE_METRICS: UsageMetricKey[] = [
  UsageMetric.PATIENTS,
  UsageMetric.USERS,
  UsageMetric.AI_REQUESTS,
  UsageMetric.STORAGE_BYTES,
  UsageMetric.APPOINTMENTS,
];

export type CurrentUsageSnapshot = Record<UsageMetricKey, number>;
