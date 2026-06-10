'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { setClientSessionHint } from '../utils/client-session-hint';
import { getPostAuthPath } from '../utils/get-post-auth-path';

export function useCompleteAuth() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const completeAuth = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      try {
        const me = await authApi.getMe();
        setUser(me);
        setClientSessionHint();
        router.push(getPostAuthPath(me.role, me.memberStatus, me.onboardingCompleted));
      } catch {
        logout();
        throw new Error('Could not load your account. Please try signing in again.');
      }
    },
    [logout, router, setAccessToken, setUser],
  );

  return { completeAuth };
}
