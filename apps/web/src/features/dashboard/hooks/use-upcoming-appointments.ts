import { useQuery } from '@tanstack/react-query';

import { appointmentsApi } from '@/features/appointments/api/appointments.api';

import { dashboardQueryKeys } from './query-keys';

const UPCOMING_DAYS = 14;
const UPCOMING_LIMIT = 5;

function getUpcomingRange() {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + UPCOMING_DAYS);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function useUpcomingAppointments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardQueryKeys.upcomingAppointments(),
    queryFn: async () => {
      const range = getUpcomingRange();
      const appointments = await appointmentsApi.list(range);

      return appointments
        .filter(
          (appointment) =>
            appointment.status !== 'CANCELLED' &&
            appointment.status !== 'NO_SHOW',
        )
        .slice(0, UPCOMING_LIMIT);
    },
    enabled: options?.enabled ?? true,
  });
}
