'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { MembersTable } from '@/features/organizations/components/members-table';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function MembersSettingsPage() {
  const router = useRouter();
  const user = useAuth().user;

  const canManageMembers = hasPermission(user?.role, Permission.MEMBER_MANAGE);
  const canInviteClients = hasPermission(user?.role, Permission.CLIENT_INVITE);
  const canInviteStaff = hasPermission(user?.role, Permission.STAFF_INVITE);
  const canAccessPage = canManageMembers || canInviteClients || canInviteStaff;

  useEffect(() => {
    if (user && !canAccessPage) {
      router.replace('/dashboard');
    }
  }, [router, user, canAccessPage]);

  if (user && !canAccessPage) {
    return null;
  }

  return (
    <MembersTable
      canManageMembers={canManageMembers}
      canInviteClients={canInviteClients}
      canInviteStaff={canInviteStaff}
    />
  );
}
