import type { ListPatientsQueryValues } from '../schemas/patient.schema';

export const patientsQueryKeys = {
  all: ['patients'] as const,
  list: (query: ListPatientsQueryValues) =>
    [...patientsQueryKeys.all, 'list', query] as const,
  detail: (id: string) => [...patientsQueryKeys.all, 'detail', id] as const,
  timeline: (id: string) => [...patientsQueryKeys.all, 'timeline', id] as const,
};
