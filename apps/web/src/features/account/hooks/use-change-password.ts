'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { accountApi } from '../api/account.api';
import type { ChangePasswordPayload } from '../api/account.api';

export function useChangePassword() {
  const router = useRouter();
  const notify = useNotificationStore((state) => state.notify);
  const logoutStore = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      accountApi.changePassword(payload),
    onSuccess: (data) => {
      notify({
        type: 'success',
        message: `${data.message}. Please sign in again.`,
      });
      logoutStore();
      router.push('/login');
    },
    onError: (error) => {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not change password'),
      });
    },
  });
}
