'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { Role } from '@/features/auth/types/role.type';
import { isStaffRole } from '@/features/auth/utils/get-post-auth-path';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

const POLL_INTERVAL_MS = 15_000;

export default function PendingOnboardingPage() {
  const router = useRouter();
  const { accessToken, user, isInitialized, setUser } = useAuth();
  const { logout, loading: logoutLoading } = useLogout();
  const notify = useNotificationStore((state) => state.notify);
  const [checking, setChecking] = useState(false);

  const redirectIfApproved = useCallback(
    (me: NonNullable<typeof user>) => {
      if (me.memberStatus === 'ACTIVE' && isStaffRole(me.role)) {
        router.replace('/dashboard');
        return true;
      }
      if (me.role === Role.PATIENT) {
        router.replace('/portal');
        return true;
      }
      return false;
    },
    [router],
  );

  const refreshApprovalStatus = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setChecking(true);
    try {
      const me = await authApi.getMe();
      setUser(me);
      if (redirectIfApproved(me)) {
        notify({ type: 'success', message: 'Your account has been approved' });
      }
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not refresh status'),
      });
    } finally {
      setChecking(false);
    }
  }, [accessToken, notify, redirectIfApproved, setUser]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (user && redirectIfApproved(user)) {
      return;
    }
  }, [accessToken, isInitialized, redirectIfApproved, router, user]);

  useEffect(() => {
    if (!accessToken || !isInitialized) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshApprovalStatus();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [accessToken, isInitialized, refreshApprovalStatus]);

  const handleSignInDifferentAccount = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6 text-center">
        <h1 className="text-2xl font-bold">Approval pending</h1>
        <p className="text-muted-foreground text-sm">
          Your request to join the clinic is waiting for the clinic owner to approve your account.
          You will get access to the staff dashboard once approved.
        </p>
        <p className="text-muted-foreground text-xs">
          This page checks for approval every {POLL_INTERVAL_MS / 1000} seconds, or use the button
          below after the owner approves you.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            disabled={checking || !accessToken}
            onClick={() => void refreshApprovalStatus()}
          >
            {checking ? 'Checking...' : 'Check approval status'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={logoutLoading}
            onClick={() => void handleSignInDifferentAccount()}
          >
            {logoutLoading ? 'Signing out...' : 'Sign in with a different account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
