'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuth().user;

  useEffect(() => {
    if (!user) {
      return;
    }

    if (hasPermission(user.role, Permission.ORG_MANAGE)) {
      router.replace('/dashboard/settings/organization');
      return;
    }

    if (
      hasPermission(user.role, Permission.MEMBER_MANAGE) ||
      hasPermission(user.role, Permission.CLIENT_INVITE) ||
      hasPermission(user.role, Permission.STAFF_INVITE)
    ) {
      router.replace('/dashboard/settings/team');
      return;
    }

    if (hasPermission(user.role, Permission.BILLING_MANAGE)) {
      router.replace('/dashboard/settings/billing');
      return;
    }

    router.replace('/dashboard/settings/security');
  }, [router, user]);

  return null;
}
