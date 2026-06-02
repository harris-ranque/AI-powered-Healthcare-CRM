'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { getPostAuthPath } from '../utils/get-post-auth-path';

export function useCompleteAuth() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const completeAuth = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      const me = await authApi.getMe();
      setUser(me);
      router.push(getPostAuthPath(me.role, me.memberStatus));
    },
    [router, setAccessToken, setUser],
  );

  return { completeAuth };
}
