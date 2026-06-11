'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { UsageOverview } from '@/features/usage/components/usage-overview';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function UsageSettingsPage() {
  const router = useRouter();
  const user = useAuth().user;
  const canViewUsage = hasPermission(user?.role, Permission.MEMBER_MANAGE);

  useEffect(() => {
    if (user && !canViewUsage) {
      router.replace('/dashboard');
    }
  }, [router, user, canViewUsage]);

  if (user && !canViewUsage) {
    return null;
  }

  return <UsageOverview />;
}
