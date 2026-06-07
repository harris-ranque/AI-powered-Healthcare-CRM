export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  activity: () => [...dashboardQueryKeys.all, 'activity'] as const,
  analytics: (days: number) =>
    [...dashboardQueryKeys.all, 'analytics', days] as const,
  upcomingAppointments: () =>
    [...dashboardQueryKeys.all, 'upcoming-appointments'] as const,
};
