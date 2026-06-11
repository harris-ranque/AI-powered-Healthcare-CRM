export const adminQueryKeys = {
  all: ['admin'] as const,
  overview: () => [...adminQueryKeys.all, 'overview'] as const,
  organizations: () => [...adminQueryKeys.all, 'organizations'] as const,
  subscriptions: () => [...adminQueryKeys.all, 'subscriptions'] as const,
  aiUsage: () => [...adminQueryKeys.all, 'ai-usage'] as const,
  health: () => [...adminQueryKeys.all, 'health'] as const,
};
