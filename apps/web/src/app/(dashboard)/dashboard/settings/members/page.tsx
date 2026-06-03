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

  useEffect(() => {
    if (user && !canManageMembers && !canInviteClients) {
      router.replace('/dashboard');
    }
  }, [router, user, canManageMembers, canInviteClients]);

  if (user && !canManageMembers && !canInviteClients) {
    return null;
  }

  return <MembersTable canManageMembers={canManageMembers} canInviteClients={canInviteClients} />;
}
