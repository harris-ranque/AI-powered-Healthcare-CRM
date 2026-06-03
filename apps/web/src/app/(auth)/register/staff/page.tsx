'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';

import { AuthDivider } from '@/features/auth/components/auth-divider';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { RegisterStaffForm } from '@/features/auth/components/register-staff-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { useGoogleOnboarding } from '@/features/auth/hooks/use-google-onboarding';
import { useInvitation } from '@/features/auth/hooks/use-invitation';
import { Role } from '@/features/auth/types/role.type';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterStaffFormValues } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

function RegisterStaffContent() {
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
    if (!prefill && !invitePrefill) {
      return undefined;
    }
    const staffRole =
      invitePrefill?.role === Role.DOCTOR ||
      invitePrefill?.role === Role.NURSE ||
      invitePrefill?.role === Role.RECEPTIONIST
        ? invitePrefill.role
        : Role.DOCTOR;
    return {
      email: invitePrefill?.email ?? prefill?.email ?? '',
      name: prefill?.name ?? '',
      clinicSlug: invitePrefill?.clinicSlug,
      role: staffRole,
      inviteToken: invitePrefill?.inviteToken,
    };
  }, [prefill, invitePrefill]);

  const handleSubmit = async (values: RegisterStaffFormValues) => {
    try {
      setLoading(true);
      setApiError(null);
      const { password, googleToken: token, inviteToken, ...rest } = values;
      const data = await authApi.registerStaff({
        ...rest,
        ...(inviteToken ? { inviteToken } : {}),
        ...(token ? { googleToken: token } : { password }),
      });
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
          <h1 className="text-2xl font-bold">Individual provider registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Join an existing clinic as doctor, nurse, or receptionist. Owner approval required.
          </p>
        </div>

        {invitePrefill ? (
          <p className="rounded-md border bg-zinc-50 px-3 py-2 text-sm">
            You were invited to join <strong>{invitePrefill.organizationName}</strong> as{' '}
            <strong>{invitePrefill.role.toLowerCase()}</strong>
          </p>
        ) : null}

        {!isGoogleOnboarding && !isInviteFlow ? (
          <>
            <GoogleSignInButton persona="provider" providerType="individual" />
            <AuthDivider />
          </>
        ) : null}

        {onboardingError ? <p className="text-sm text-red-600">{onboardingError}</p> : null}
        {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

        <RegisterStaffForm
          loading={loading}
          apiError={apiError}
          googleToken={googleToken}
          hidePassword={isGoogleOnboarding}
          emailLocked={isGoogleOnboarding || Boolean(invitePrefill)}
          clinicLocked={Boolean(invitePrefill)}
          roleLocked={Boolean(invitePrefill)}
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

export default function RegisterStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-zinc-500">
          Loading...
        </div>
      }
    >
      <RegisterStaffContent />
    </Suspense>
  );
}
