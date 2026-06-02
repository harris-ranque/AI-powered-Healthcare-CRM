'use client';

import Link from 'next/link';
import { useState } from 'react';

import { RegisterStaffForm } from '@/features/auth/components/register-staff-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterStaffFormValues } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

export default function RegisterStaffPage() {
  const { completeAuth } = useCompleteAuth();
  const notify = useNotificationStore((state) => state.notify);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (values: RegisterStaffFormValues) => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await authApi.registerStaff(values);
      notify({
        type: 'success',
        message: 'Request submitted — waiting for clinic owner approval',
      });
      await completeAuth(data.access_token);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to register staff');
      setApiError(message);
      notify({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6">
        <div>
          <h1 className="text-2xl font-bold">Join as staff</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask your clinic owner for the clinic slug. Your account stays pending until approved.
          </p>
        </div>
        <RegisterStaffForm loading={loading} apiError={apiError} onSubmit={handleSubmit} />
        <p className="text-center text-sm text-zinc-600">
          <Link href="/register" className="underline">
            Back
          </Link>
          {' · '}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
