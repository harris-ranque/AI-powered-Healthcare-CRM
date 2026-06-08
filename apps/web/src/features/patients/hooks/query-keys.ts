import type { ListPatientsQuery } from '../types/patient.type';

export const patientsQueryKeys = {
  all: ['patients'] as const,
  list: (query: Required<ListPatientsQuery>) =>
    [...patientsQueryKeys.all, 'list', query] as const,
  detail: (id: string) => [...patientsQueryKeys.all, 'detail', id] as const,
  timeline: (id: string) => [...patientsQueryKeys.all, 'timeline', id] as const,
};
