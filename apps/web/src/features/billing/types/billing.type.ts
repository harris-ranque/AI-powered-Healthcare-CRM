export type SubscriptionPlan =
  | 'FREE'
  | 'STARTER'
  | 'PROFESSIONAL'
  | 'ENTERPRISE';

export type OrganizationBilling = {
  id: string;
  name: string;
  subscriptionPlan: SubscriptionPlan;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionPlan: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  memberLimit: number;
  patientLimit: number;
  aiRequestLimitPerMonth: number;
  storageLimitMb: number;
};

export type BillingUsageSnapshot = {
  patients: number;
  users: number;
  ai_requests: number;
  storage_bytes: number;
  appointments: number;
};

export type CheckoutPlan = 'starter' | 'pro';

export type CancelSubscriptionResult = {
  canceledAtPeriodEnd: true;
  currentPeriodEnd: string | null;
};
