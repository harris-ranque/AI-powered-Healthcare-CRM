'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

export default function RegisterPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const notify = useNotificationStore((state) => state.notify);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      const data = await authApi.register(email, password, name);
      setAccessToken(data.access_token);
      notify({ type: 'success', message: 'Account created successfully' });
      router.push('/dashboard');
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Failed to register'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-4">
        <h1 className="text-2xl font-bold">Create account</h1>

        <input
          className="w-full border p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          autoComplete="name"
        />
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
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
        />
        <button
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
          onClick={handleRegister}
          disabled={loading || !name || !email || !password}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
