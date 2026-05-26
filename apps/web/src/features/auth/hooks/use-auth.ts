import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return { accessToken, isInitialized, setAccessToken };
}