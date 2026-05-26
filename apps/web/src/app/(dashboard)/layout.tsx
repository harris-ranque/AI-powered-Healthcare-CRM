'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading...</div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
