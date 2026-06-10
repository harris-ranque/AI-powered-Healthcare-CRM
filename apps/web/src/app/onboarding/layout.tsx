'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Role } from '@/features/auth/types/role.type';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
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
    if (user && user.role !== Role.CLINIC_OWNER) {
      router.push('/dashboard');
      return;
    }
    if (user?.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [accessToken, isInitialized, router, user]);

  if (!isInitialized || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return children;
}
