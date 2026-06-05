export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  activity: () => [...dashboardQueryKeys.all, 'activity'] as const,
};
