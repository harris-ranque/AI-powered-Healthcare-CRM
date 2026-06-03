'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';

import { AuthDivider } from '@/features/auth/components/auth-divider';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { RegisterPatientForm } from '@/features/auth/components/register-patient-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { useGoogleOnboarding } from '@/features/auth/hooks/use-google-onboarding';
import { useInvitation } from '@/features/auth/hooks/use-invitation';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterPatientFormValues } from '@/features/auth/schemas/register.schema';
import { splitGoogleName } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

function RegisterClientContent() {
  const { completeAuth } = useCompleteAuth();
  const notify = useNotificationStore((state) => state.notify);
  const { googleToken, loading: onboardingLoading, error: onboardingError, prefill, isGoogleOnboarding } =
    useGoogleOnboarding();
  const {
    loading: inviteLoading,
    error: inviteError,
    prefill: invitePrefill,
    isInviteFlow,
  } = useInvitation();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const initialValues = useMemo(() => {
    const googleName = prefill ? splitGoogleName(prefill.name) : { firstName: '', lastName: '' };
    if (!prefill && !invitePrefill) {
      return undefined;
    }
    return {
      email: invitePrefill?.email ?? prefill?.email ?? '',
      firstName: googleName.firstName,
      lastName: googleName.lastName,
      clinicSlug: invitePrefill?.clinicSlug,
      inviteToken: invitePrefill?.inviteToken,
    };
  }, [prefill, invitePrefill]);

  const handleSubmit = async (values: RegisterPatientFormValues) => {
    try {
      setLoading(true);
      setApiError(null);
      const { phone, dateOfBirth, password, googleToken: token, inviteToken, ...rest } = values;
      const payload = {
        ...rest,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        ...(inviteToken ? { inviteToken } : {}),
        ...(token ? { googleToken: token } : { password }),
      };
      const data = await authApi.registerPatient(payload);
      notify({ type: 'success', message: 'Client account created' });
      await completeAuth(data.access_token);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to register');
      setApiError(message);
      notify({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  if (onboardingLoading || inviteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading Google profile...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6">
        <div>
          <h1 className="text-2xl font-bold">Client registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a patient account to access your health portal.
          </p>
        </div>

        {invitePrefill ? (
          <p className="rounded-md border bg-zinc-50 px-3 py-2 text-sm">
            You were invited to join <strong>{invitePrefill.organizationName}</strong>
          </p>
        ) : null}

        {!isGoogleOnboarding && !isInviteFlow ? (
          <>
            <GoogleSignInButton persona="client" />
            <AuthDivider />
          </>
        ) : null}

        {onboardingError ? <p className="text-sm text-red-600">{onboardingError}</p> : null}
        {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

        <RegisterPatientForm
          loading={loading}
          apiError={apiError}
          googleToken={googleToken}
          hidePassword={isGoogleOnboarding}
          emailLocked={isGoogleOnboarding || Boolean(invitePrefill)}
          clinicLocked={Boolean(invitePrefill)}
          clinicDisplayName={invitePrefill?.organizationName}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        />

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

export default function RegisterClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-zinc-500">
          Loading...
        </div>
      }
    >
      <RegisterClientContent />
    </Suspense>
  );
}
