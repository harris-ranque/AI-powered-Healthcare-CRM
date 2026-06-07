import { api } from '@/lib/api/client';

import type { Comment } from '../types/comment.type';

export const commentsApi = {
  listForPatient: async (patientId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/patients/${patientId}/comments`);
    return response.data;
  },

  createForPatient: async (
    patientId: string,
    body: string,
  ): Promise<Comment> => {
    const response = await api.post<Comment>(`/patients/${patientId}/comments`, {
      body,
    });
    return response.data;
  },

  listForAppointment: async (appointmentId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(
      `/appointments/${appointmentId}/comments`,
    );
    return response.data;
  },

  createForAppointment: async (
    appointmentId: string,
    body: string,
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/appointments/${appointmentId}/comments`,
      { body },
    );
    return response.data;
  },

  remove: async (commentId: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/comments/${commentId}`);
    return response.data;
  },
};
