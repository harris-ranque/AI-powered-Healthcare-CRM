import type { ListAppointmentsQuery } from '../types/appointment.type';

export const appointmentsQueryKeys = {
  all: ['appointments'] as const,
  list: (query: ListAppointmentsQuery) =>
    [...appointmentsQueryKeys.all, 'list', query] as const,
  detail: (id: string) => [...appointmentsQueryKeys.all, 'detail', id] as const,
};
