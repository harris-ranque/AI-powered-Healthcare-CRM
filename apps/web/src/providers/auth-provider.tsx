'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      void restoreSession();
    }
  }, [isInitialized, restoreSession]);

  return children;
}
