'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PortalLayout } from '@/components/layouts/portal-layout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getPostAuthPath, isPatientRole } from '@/features/auth/utils/get-post-auth-path';
import { Role } from '@/features/auth/types/role.type';

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
    if (user && !isPatientRole(user.role)) {
      router.push(getPostAuthPath(user.role, user.memberStatus));
    }
  }, [accessToken, isInitialized, router, user]);

  if (!isInitialized || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading...</div>
    );
  }

  if (user && user.role !== Role.PATIENT) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Redirecting...
      </div>
    );
  }

  return <PortalLayout>{children}</PortalLayout>;
}
