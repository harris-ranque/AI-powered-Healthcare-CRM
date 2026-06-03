'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { useNotificationStore } from '@/features/notifications/store/notification.store';

function OauthSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeAuth } = useCompleteAuth();
  const notify = useNotificationStore((state) => state.notify);

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      notify({
        type: 'error',
        message: 'Google sign-in failed. Please try again.',
      });
      router.push('/login?error=google_auth_failed');
      return;
    }

    const accessToken = params.get('access_token');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    void completeAuth(accessToken);
  }, [completeAuth, notify, params, router]);

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
