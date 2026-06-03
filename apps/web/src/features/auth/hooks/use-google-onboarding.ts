'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { authApi } from '../api/auth.api';

export function useGoogleOnboarding() {
  const params = useSearchParams();
  const googleToken = params.get('onboarding');
  const [loading, setLoading] = useState(!!googleToken);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    if (!googleToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await authApi.getGoogleOnboarding(googleToken);
        if (!cancelled) {
          setPrefill(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Google sign-in session expired. Please try again.');
          setPrefill(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [googleToken]);

  return { googleToken, loading, error, prefill, isGoogleOnboarding: !!googleToken };
}
