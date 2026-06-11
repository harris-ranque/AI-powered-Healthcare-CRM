'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AdminLayout } from '@/components/layouts/admin-layout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Role } from '@/features/auth/types/role.type';

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    if (user && user.role !== Role.SUPER_ADMIN) {
      router.push('/dashboard');
    }
  }, [accessToken, isInitialized, router, user]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting to sign in...
      </div>
    );
  }

  if (user && user.role !== Role.SUPER_ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
