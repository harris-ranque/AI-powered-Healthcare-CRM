/** Values must match `enum SubscriptionPlan` in prisma/schema.prisma */
export const SubscriptionPlan = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
