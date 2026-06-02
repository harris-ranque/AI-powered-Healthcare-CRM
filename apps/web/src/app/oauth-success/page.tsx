'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';

function OauthSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeAuth } = useCompleteAuth();

  useEffect(() => {
    const accessToken = params.get('access_token');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    void completeAuth(accessToken);
  }, [completeAuth, params, router]);

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
