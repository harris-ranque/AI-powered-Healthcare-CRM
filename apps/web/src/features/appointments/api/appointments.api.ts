import { api } from '@/lib/api/client';

import type {
  Appointment,
  CreateAppointmentInput,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from '../types/appointment.type';

function toListParams(
  query: ListAppointmentsQuery,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.patientId) params.patientId = query.patientId;
  if (query.providerId) params.providerId = query.providerId;
  if (query.status) params.status = query.status;
  return params;
}

export const appointmentsApi = {
  list: async (query: ListAppointmentsQuery): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/appointments', {
      params: toListParams(query),
    });
    return response.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  create: async (input: CreateAppointmentInput): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', input);
    return response.data;
  },

  update: async (
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment> => {
    const response = await api.patch<Appointment>(`/appointments/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/appointments/${id}`);
    return response.data;
  },
};
