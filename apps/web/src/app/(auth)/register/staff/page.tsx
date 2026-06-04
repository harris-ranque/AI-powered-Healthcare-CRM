'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';

import { OtpVerificationForm } from '@/features/auth/components/otp-verification-form';
import { RegisterStaffForm } from '@/features/auth/components/register-staff-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { useOtpStep } from '@/features/auth/hooks/use-otp-step';
import { useGoogleOnboarding } from '@/features/auth/hooks/use-google-onboarding';
import { useInvitation } from '@/features/auth/hooks/use-invitation';
import { Role } from '@/features/auth/types/role.type';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterStaffFormValues } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

function RegisterStaffContent() {
  const { completeAuth } = useCompleteAuth();
  const { pending, isOtpStep, startOtp, clearOtp } = useOtpStep();
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
      notify({ type: 'success', message: 'Check your email for a verification code' });
      startOtp(data);
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
      <div className="medical-gradient-bg flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isInviteFlow) {
    return (
      <div className="medical-gradient-bg flex min-h-screen items-center justify-center p-4">
        <div className="medical-card-glow bg-card w-full max-w-md space-y-4 rounded-xl border p-6">
          <div>
            <h1 className="text-primary text-2xl font-bold">Staff registration</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              To join a clinic as staff, you need an invitation from your clinic owner or an
              authorized team member. Check your email for an invite link.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              Running your own solo practice?{' '}
              <Link href="/register/solo" className="text-primary font-medium underline">
                Register as an individual provider
              </Link>
            </p>
            <p>
              Registering a multi-provider clinic?{' '}
              <Link href="/register/clinic" className="text-primary font-medium underline">
                Register your organization
              </Link>
            </p>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-primary underline">
              Log in
            </Link>
            {' · '}
            <Link href="/register" className="text-primary underline">
              Back
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="medical-card-glow bg-card w-full max-w-md space-y-4 rounded-xl border p-6">
        <div>
          <h1 className="text-primary text-2xl font-bold">Accept your invitation</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete registration to join your clinic as a team member.
          </p>
        </div>

        {invitePrefill ? (
          <p className="bg-muted/50 rounded-md border px-3 py-2 text-sm">
            You were invited to join <strong>{invitePrefill.organizationName}</strong> as{' '}
            <strong>{invitePrefill.role.toLowerCase()}</strong>
          </p>
        ) : null}

        {onboardingError ? <p className="text-sm text-red-600">{onboardingError}</p> : null}
        {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

        {isOtpStep && pending ? (
          <OtpVerificationForm
            pending={pending}
            onVerified={completeAuth}
            onBack={clearOtp}
            successMessage="Welcome to the team — you can sign in now"
          />
        ) : (
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
        )}

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/register" className="text-primary underline">
            Back
          </Link>
          {' · '}
          <Link href="/login" className="text-primary underline">
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
        <div className="medical-gradient-bg flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <RegisterStaffContent />
    </Suspense>
  );
}
