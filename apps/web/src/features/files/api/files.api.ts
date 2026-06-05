import { api } from '@/lib/api/client';

import type {
  ConfirmUploadInput,
  PatientFile,
  UploadUrlResponse,
} from '../types/file.type';

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

  confirmUpload: async (input: ConfirmUploadInput): Promise<PatientFile> => {
    const response = await api.post<PatientFile>('/storage/files', input);
    return response.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/storage/files/${id}`);
    return response.data;
  },

  getDownloadUrl: async (id: string): Promise<{ url: string; expiresIn: number }> => {
    const response = await api.get<{ url: string; expiresIn: number }>(
      `/storage/files/${id}/download-url`,
    );
    return response.data;
  },
};
