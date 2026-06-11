'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Role } from '@/features/auth/types/role.type';
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
      if (user.role === Role.SUPER_ADMIN) {
        router.push('/admin');
        return;
      }
      if (isPatientRole(user.role)) {
        router.push('/portal');
        return;
      }
      if (user.role === Role.CLINIC_OWNER && user.onboardingCompleted === false) {
        router.push('/onboarding');
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

  if (
    user &&
    (user.role === Role.SUPER_ADMIN ||
      isPatientRole(user.role) ||
      user.memberStatus === 'PENDING' ||
      (user.role === Role.CLINIC_OWNER && user.onboardingCompleted === false))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
