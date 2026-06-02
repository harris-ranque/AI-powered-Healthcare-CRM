'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { MembersTable } from '@/features/organizations/components/members-table';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function MembersSettingsPage() {
  const router = useRouter();
  const user = useAuth().user;

  useEffect(() => {
    if (user && !hasPermission(user.role, Permission.MEMBER_MANAGE)) {
      router.replace('/dashboard');
    }
  }, [router, user]);

  if (user && !hasPermission(user.role, Permission.MEMBER_MANAGE)) {
    return null;
  }

  return <MembersTable />;
}
