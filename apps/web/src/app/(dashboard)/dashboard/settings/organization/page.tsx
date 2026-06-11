'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { OrganizationSettingsForm } from '@/features/organizations/components/organization-settings-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const user = useAuth().user;
  const canManageOrg = hasPermission(user?.role, Permission.ORG_MANAGE);

  useEffect(() => {
    if (user && !canManageOrg) {
      router.replace('/dashboard');
    }
  }, [router, user, canManageOrg]);

  if (user && !canManageOrg) {
    return null;
  }

  return <OrganizationSettingsForm />;
}
