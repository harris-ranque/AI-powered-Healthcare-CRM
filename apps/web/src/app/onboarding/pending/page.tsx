'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Role } from '@/features/auth/types/role.type';
import { isStaffRole } from '@/features/auth/utils/get-post-auth-path';

export default function PendingOnboardingPage() {
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
    if (user && user.memberStatus === 'ACTIVE' && isStaffRole(user.role)) {
      router.push('/dashboard');
    }
    if (user && user.role === Role.PATIENT) {
      router.push('/portal');
    }
  }, [accessToken, isInitialized, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6 text-center">
        <h1 className="text-2xl font-bold">Approval pending</h1>
        <p className="text-muted-foreground text-sm">
          Your request to join the clinic is waiting for the clinic owner to approve your account.
          You will get access to the staff dashboard once approved.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
