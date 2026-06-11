import { SubscriptionPlan } from '../../common/enums/subscriptionplan.enum';

export const UNLIMITED_DB_LIMIT = 2_147_483_647;

export type PlanConfig = {
  memberLimit: number;
  patientLimit: number;
  aiRequestLimitPerMonth: number;
  storageLimitMb: number;
  apiLimitPerMonth: number;
  features: readonly string[];
};

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    memberLimit: 2,
    patientLimit: 50,
    aiRequestLimitPerMonth: 20,
    storageLimitMb: 1024,
    apiLimitPerMonth: 10_000,
    features: ['basic_dashboard'],
  },
  [SubscriptionPlan.STARTER]: {
    memberLimit: 5,
    patientLimit: 500,
    aiRequestLimitPerMonth: 100,
    storageLimitMb: 10_240,
    apiLimitPerMonth: 100_000,
    features: ['basic_dashboard', 'payments', 'notifications'],
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    memberLimit: 25,
    patientLimit: 5_000,
    aiRequestLimitPerMonth: 5_000,
    storageLimitMb: 51_200,
    apiLimitPerMonth: 1_000_000,
    features: ['analytics', 'advanced_reports', 'priority_support'],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    memberLimit: Number.POSITIVE_INFINITY,
    patientLimit: Number.POSITIVE_INFINITY,
    aiRequestLimitPerMonth: Number.POSITIVE_INFINITY,
    storageLimitMb: Number.POSITIVE_INFINITY,
    apiLimitPerMonth: Number.POSITIVE_INFINITY,
    features: ['everything'],
  },
};

export function toDbLimit(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : UNLIMITED_DB_LIMIT;
}

export function planLimitsForDb(plan: SubscriptionPlan): {
  memberLimit: number;
  patientLimit: number;
  aiRequestLimitPerMonth: number;
  storageLimitMb: number;
  apiLimitPerMonth: number;
} {
  const config = PLAN_CONFIG[plan];
  return {
    memberLimit: toDbLimit(config.memberLimit),
    patientLimit: toDbLimit(config.patientLimit),
    aiRequestLimitPerMonth: toDbLimit(config.aiRequestLimitPerMonth),
    storageLimitMb: toDbLimit(config.storageLimitMb),
    apiLimitPerMonth: toDbLimit(config.apiLimitPerMonth),
  };
}
