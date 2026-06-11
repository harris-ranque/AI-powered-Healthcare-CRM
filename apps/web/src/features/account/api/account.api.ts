import { api } from '@/lib/api/client';

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const accountApi = {
  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      '/auth/change-password',
      payload,
    );
    return response.data;
  },
};
