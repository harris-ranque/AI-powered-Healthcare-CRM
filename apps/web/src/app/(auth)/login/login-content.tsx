'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AuthDivider } from '@/features/auth/components/auth-divider';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { PersonaToggle } from '@/features/auth/components/persona-toggle';
import { authApi } from '@/features/auth/api/auth.api';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import type { AuthPersona, ProviderType } from '@/features/auth/types/persona.type';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

export default function LoginPageContent() {
  const params = useSearchParams();
  const { completeAuth } = useCompleteAuth();
  const notify = useNotificationStore((state) => state.notify);

  const [persona, setPersona] = useState<AuthPersona>('client');
  const [providerType, setProviderType] = useState<ProviderType>('organization');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('error') === 'google_auth_failed') {
      notify({
        type: 'error',
        message: 'Google sign-in was cancelled or failed. Please try again.',
      });
    }
  }, [params, notify]);

  const registerHref =
    persona === 'client'
      ? '/register/client'
      : providerType === 'individual'
        ? '/register/staff'
        : '/register/clinic';

  const handleLogin = async () => {
    try {
      setLoading(true);
      const data = await authApi.login(email, password);
      notify({ type: 'success', message: 'Logged in successfully' });
      await completeAuth(data.access_token);
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-4">
        <div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose whether you are signing in as a client or provider.
          </p>
        </div>

        <PersonaToggle
          persona={persona}
          onPersonaChange={setPersona}
          providerType={providerType}
          onProviderTypeChange={setProviderType}
          showProviderSubType
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />
        <button
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
          onClick={() => void handleLogin()}
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <AuthDivider />

        <GoogleSignInButton persona={persona} providerType={providerType} disabled={loading} />

        <p className="text-center text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link href={registerHref} className="font-medium text-black underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
