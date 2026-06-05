import { api } from '@/lib/api/client';

import type { AiSummaryEntry, ClinicalNote } from '../types/clinical-note.type';

export const clinicalNotesApi = {
  list: async (patientId: string): Promise<ClinicalNote[]> => {
    const response = await api.get<ClinicalNote[]>(`/patients/${patientId}/notes`);
    return response.data;
  },

  create: async (patientId: string, body: string): Promise<ClinicalNote> => {
    const response = await api.post<ClinicalNote>(`/patients/${patientId}/notes`, { body });
    return response.data;
  },

  update: async (noteId: string, body: string): Promise<ClinicalNote> => {
    const response = await api.patch<ClinicalNote>(`/notes/${noteId}`, { body });
    return response.data;
  },

  delete: async (noteId: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/notes/${noteId}`);
    return response.data;
  },

  summarize: async (
    noteId: string,
  ): Promise<{ note: ClinicalNote; summary: string; tokens: number }> => {
    const response = await api.post<{ note: ClinicalNote; summary: string; tokens: number }>(
      `/notes/${noteId}/summarize`,
    );
    return response.data;
  },

  listAiSummaries: async (patientId: string): Promise<AiSummaryEntry[]> => {
    const response = await api.get<AiSummaryEntry[]>(`/patients/${patientId}/ai-summaries`);
    return response.data;
  },

  summarizeText: async (input: {
    notes: string;
    patientId: string;
  }): Promise<{ summary: string; tokens: number }> => {
    const response = await api.post<{ summary: string; tokens: number }>(
      '/ai/medical-note-summary',
      input,
    );
    return response.data;
  },
};
