'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { isPatientRole, isStaffRole } from '@/features/auth/utils/get-post-auth-path';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, user, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (user) {
      if (isPatientRole(user.role)) {
        router.push('/portal');
        return;
      }
      if (isStaffRole(user.role) && user.memberStatus === 'PENDING') {
        router.push('/onboarding/pending');
      }
    }
  }, [accessToken, isInitialized, router, user]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting to sign in...
      </div>
    );
  }

  if (user && (isPatientRole(user.role) || user.memberStatus === 'PENDING')) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
