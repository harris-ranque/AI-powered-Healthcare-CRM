import { useQuery } from '@tanstack/react-query';

import { appointmentsApi } from '../api/appointments.api';
import type { ListAppointmentsQuery } from '../types/appointment.type';
import { appointmentsQueryKeys } from './query-keys';

export function useAppointmentsList(
  query: ListAppointmentsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: appointmentsQueryKeys.list(query),
    queryFn: () => appointmentsApi.list(query),
    enabled: options?.enabled ?? true,
  });
}
