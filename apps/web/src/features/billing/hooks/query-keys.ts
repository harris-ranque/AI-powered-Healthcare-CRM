export const billingQueryKeys = {
  all: ['billing'] as const,
  organization: () => [...billingQueryKeys.all, 'organization'] as const,
  usage: () => [...billingQueryKeys.all, 'usage'] as const,
};
