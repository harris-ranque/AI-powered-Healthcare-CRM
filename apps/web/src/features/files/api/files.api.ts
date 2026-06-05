import { api } from '@/lib/api/client';

import type { PatientFile, UploadUrlResponse } from '../types/file.type';

export type CreateUploadUrlInput = {
  fileName: string;
  mimeType: string;
  size: number;
  patientId: string;
};

export const filesApi = {
  listForPatient: async (patientId: string): Promise<PatientFile[]> => {
    const response = await api.get<PatientFile[]>('/storage/files', {
      params: { patientId },
    });
    return response.data;
  },

  createUploadUrl: async (input: CreateUploadUrlInput): Promise<UploadUrlResponse> => {
    const response = await api.post<UploadUrlResponse>('/storage/upload-url', input);
    return response.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/storage/files/${id}`);
    return response.data;
  },
};
