import { SubscriptionPlan } from '../../common/enums/subscriptionplan.enum';

export type PlanConfig = {
  memberLimit: number;
  storageLimitMb: number;
  apiLimitPerMonth: number;
  features: readonly string[];
};

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    memberLimit: 5,
    storageLimitMb: 1024,
    apiLimitPerMonth: 10_000,
    features: ['basic_dashboard'],
  },
  [SubscriptionPlan.STARTER]: {
    memberLimit: 20,
    storageLimitMb: 10_240,
    apiLimitPerMonth: 100_000,
    features: ['basic_dashboard', 'payments', 'notifications'],
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    memberLimit: 100,
    storageLimitMb: 51_200,
    apiLimitPerMonth: 1_000_000,
    features: ['analytics', 'advanced_reports', 'priority_support'],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    memberLimit: Number.POSITIVE_INFINITY,
    storageLimitMb: Number.POSITIVE_INFINITY,
    apiLimitPerMonth: Number.POSITIVE_INFINITY,
    features: ['everything'],
  },
};
