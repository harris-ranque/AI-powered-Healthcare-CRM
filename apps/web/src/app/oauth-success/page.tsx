'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';

function OauthSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const accessToken = params.get('access_token');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setAccessToken(accessToken);
    router.push('/dashboard');
  }, [params, router, setAccessToken]);

  return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
}

export default function OauthSuccessPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <OauthSuccessContent />
    </Suspense>
  );
}
