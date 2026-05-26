import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { AuthUser } from '../types/auth-user.type';

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
    try {
      const data = await authApi.refresh();
      set({ accessToken: data.access_token, isInitialized: true });
    } catch {
      set({ accessToken: null, isInitialized: true });
    }
  },

  logout: () => set({ accessToken: null, user: null }),
}));
