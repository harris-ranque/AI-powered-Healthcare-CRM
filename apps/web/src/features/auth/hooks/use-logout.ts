'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

export function useLogout() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const notify = useNotificationStore((state) => state.notify);
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      notify({ type: 'success', message: 'Logged out successfully' });
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Failed to log out'),
      });
    } finally {
      logoutStore();
      setLoading(false);
      router.push('/login');
    }
  };

  return { logout, loading };
}
