import { api } from '@/lib/api/client';

import type { PatientDetail } from '../types/patient-detail.type';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  Patient,
  UpdatePatientInput,
} from '../types/patient.type';
import type { Paginated } from '../types/paginated.type';

function toListParams(query: ListPatientsQuery): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search) params.search = query.search;
  if (query.includeDeleted !== undefined) params.includeDeleted = query.includeDeleted;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.order) params.order = query.order;
  return params;
}

export const patientsApi = {
  list: async (query: ListPatientsQuery): Promise<Paginated<Patient>> => {
    const response = await api.get<Paginated<Patient>>('/patients', {
      params: toListParams(query),
    });
    return response.data;
  },
  getById: async (id: string): Promise<PatientDetail> => {
    const response = await api.get<PatientDetail>(`/patients/${id}`);
    return response.data;
  },
  create: async (input: CreatePatientInput): Promise<Patient> => {
    const response = await api.post<Patient>('/patients', input);
    return response.data;
  },
  update: async (id: string, input: UpdatePatientInput): Promise<Patient> => {
    const response = await api.patch<Patient>(`/patients/${id}`, input);
    return response.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/patients/${id}`);
    return response.data;
  },
};
