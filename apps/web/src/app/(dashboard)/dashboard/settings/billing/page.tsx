'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { BillingOverview } from '@/features/billing/components/billing-overview';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useNotificationStore } from '@/features/notifications/store/notification.store';

export default function BillingSettingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuth().user;
  const notify = useNotificationStore((state) => state.notify);

  const canManageBilling = hasPermission(user?.role, Permission.BILLING_MANAGE);

  useEffect(() => {
    if (user && !canManageBilling) {
      router.replace('/dashboard');
    }
  }, [router, user, canManageBilling]);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      notify({ type: 'success', message: 'Subscription activated' });
      router.replace('/dashboard/settings/billing');
    }
    if (params.get('checkout') === 'cancel') {
      notify({ type: 'error', message: 'Checkout was cancelled' });
      router.replace('/dashboard/settings/billing');
    }
  }, [notify, params, router]);

  if (user && !canManageBilling) {
    return null;
  }

  return <BillingOverview />;
}
