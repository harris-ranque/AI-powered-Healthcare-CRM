export type AdminOverview = {
  organizations: number;
  users: number;
  activeSubscriptions: number;
  aiTokensThisMonth: number;
  aiCostThisMonth: number;
  aiRequestsThisMonth: number;
};

export type AdminOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  stripeSubscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  users: number;
  createdAt: string;
};

export type AdminSubscriptionOrgRow = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  stripeSubscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
};

export type AdminSubscriptionSummary = {
  counts: {
    active: number;
    canceled: number;
    pastDue: number;
    none: number;
  };
  organizations: {
    active: AdminSubscriptionOrgRow[];
    canceled: AdminSubscriptionOrgRow[];
    pastDue: AdminSubscriptionOrgRow[];
    none: AdminSubscriptionOrgRow[];
  };
};

export type AdminAiUsageTopCustomer = {
  organizationId: string;
  organizationName: string;
  tokens: number;
  cost: number;
  requests: number;
};

export type AdminAiUsage = {
  tokensThisMonth: number;
  costThisMonth: number;
  requestsThisMonth: number;
  topCustomers: AdminAiUsageTopCustomer[];
};

export type AdminQueueJobCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export type AdminQueueHealth = {
  name: string;
  counts: AdminQueueJobCounts;
};

export type AdminFailedJob = {
  id: string;
  queue: string;
  name: string;
  failedReason: string | null;
  timestamp: string | null;
};

export type AdminHealth = {
  uptime: number;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
  queues: AdminQueueHealth[];
  failedJobs: AdminFailedJob[];
};
