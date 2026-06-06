import { api } from '@/lib/api/client';

import type {
  AiSummaryEntry,
  ClinicalNote,
  ClinicalNoteInput,
  KeyPoints,
} from '../types/clinical-note.type';

export const clinicalNotesApi = {
  list: async (patientId: string, search?: string): Promise<ClinicalNote[]> => {
    const response = await api.get<ClinicalNote[]>(`/patients/${patientId}/notes`, {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  getById: async (noteId: string): Promise<ClinicalNote> => {
    const response = await api.get<ClinicalNote>(`/notes/${noteId}`);
    return response.data;
  },

  create: async (
    patientId: string,
    input: ClinicalNoteInput,
  ): Promise<ClinicalNote> => {
    const response = await api.post<ClinicalNote>(
      `/patients/${patientId}/notes`,
      input,
    );
    return response.data;
  },

  update: async (
    noteId: string,
    input: Partial<ClinicalNoteInput>,
  ): Promise<ClinicalNote> => {
    const response = await api.patch<ClinicalNote>(`/notes/${noteId}`, input);
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

  generateKeyPoints: async (
    noteId: string,
  ): Promise<{ note: ClinicalNote; keyPoints: KeyPoints; tokens: number }> => {
    const response = await api.post<{
      note: ClinicalNote;
      keyPoints: KeyPoints;
      tokens: number;
    }>(`/notes/${noteId}/key-points`);
    return response.data;
  },

  generateVisitSummary: async (
    noteId: string,
  ): Promise<{ note: ClinicalNote; visitSummary: string; tokens: number }> => {
    const response = await api.post<{
      note: ClinicalNote;
      visitSummary: string;
      tokens: number;
    }>(`/notes/${noteId}/visit-summary`);
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
