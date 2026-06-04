import { create } from 'zustand';

import { authApi } from '../api/auth.api';
import type { AuthUser } from '../types/auth-user.type';
import { hasSessionCookie } from '../utils/has-session-cookie';

interface AuthStore {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,

  setAccessToken: (accessToken: string) => set({ accessToken }),
  setUser: (user: AuthUser) => set({ user }),

  restoreSession: async () => {
    if (!hasSessionCookie()) {
      set({ accessToken: null, user: null, isInitialized: true });
      return;
    }

    try {
      const data = await authApi.refresh();
      // Set the token first so the request interceptor attaches it to /auth/me.
      set({ accessToken: data.access_token });
      const me = await authApi.getMe();
      set({ user: me, isInitialized: true });
    } catch {
      set({ accessToken: null, user: null, isInitialized: true });
    }
  },

  logout: () => set({ accessToken: null, user: null }),
}));
