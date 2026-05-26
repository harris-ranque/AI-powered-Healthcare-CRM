'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { env } from '@/config/env';

export default function LoginPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const notify = useNotificationStore((state) => state.notify);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const data = await authApi.login(email, password);
      setAccessToken(data.access_token);
      notify({ type: 'success', message: 'Logged in successfully' });
      router.push('/dashboard');
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Failed to login'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-4">
        <h1 className="text-2xl font-bold">Sign in</h1>

        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />
        <input
          className="w-full border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />
        <button
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs text-zinc-500">OR</span>
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded border border-zinc-300 bg-white p-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.7s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.7H12z"
            />
            <path
              fill="#34A853"
              d="M3.6 7.4l3.2 2.3C7.7 7.7 9.7 6.1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"
            />
            <path
              fill="#FBBC05"
              d="M12 21.5c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 1-3.3 1-2.5 0-4.7-1.7-5.5-4l-3.2 2.5c1.5 3.1 4.8 5.3 8.7 5.3z"
            />
            <path
              fill="#4285F4"
              d="M21.6 12.5c0-.6-.1-1.1-.2-1.7H12v3.9h5.5c-.3 1.4-1 2.5-2.2 3.3l3.1 2.4c1.8-1.7 3.2-4.2 3.2-7.9z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-black underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
