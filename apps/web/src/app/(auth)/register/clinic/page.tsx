'use client';

import Link from 'next/link';
import { useState } from 'react';

import { RegisterClinicForm } from '@/features/auth/components/register-clinic-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterClinicFormValues } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

export default function RegisterClinicPage() {
  const { completeAuth } = useCompleteAuth();
  const notify = useNotificationStore((state) => state.notify);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (values: RegisterClinicFormValues) => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await authApi.registerClinic(values);
      notify({ type: 'success', message: 'Clinic account created' });
      await completeAuth(data.access_token);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to register clinic');
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
          <h1 className="text-2xl font-bold">Register your clinic</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You will be the clinic owner with full admin access.
          </p>
        </div>
        <RegisterClinicForm loading={loading} apiError={apiError} onSubmit={handleSubmit} />
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
