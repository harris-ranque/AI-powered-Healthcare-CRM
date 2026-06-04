'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';

import { AuthDivider } from '@/features/auth/components/auth-divider';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { OtpVerificationForm } from '@/features/auth/components/otp-verification-form';
import { RegisterSoloForm } from '@/features/auth/components/register-solo-form';
import { useCompleteAuth } from '@/features/auth/hooks/use-complete-auth';
import { useOtpStep } from '@/features/auth/hooks/use-otp-step';
import { useGoogleOnboarding } from '@/features/auth/hooks/use-google-onboarding';
import { authApi } from '@/features/auth/api/auth.api';
import type { RegisterSoloFormValues } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

function RegisterSoloContent() {
  const { completeAuth } = useCompleteAuth();
  const { pending, isOtpStep, startOtp, clearOtp } = useOtpStep();
  const notify = useNotificationStore((state) => state.notify);
  const { googleToken, loading: onboardingLoading, error: onboardingError, prefill, isGoogleOnboarding } =
    useGoogleOnboarding();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const initialValues = useMemo(() => {
    if (!prefill) {
      return undefined;
    }
    return {
      email: prefill.email,
      name: prefill.name ?? '',
    };
  }, [prefill]);

  const handleSubmit = async (values: RegisterSoloFormValues) => {
    try {
      setLoading(true);
      setApiError(null);
      const { password, googleToken: token, practiceName, ...rest } = values;
      const data = await authApi.registerSolo({
        ...rest,
        ...(practiceName?.trim() ? { practiceName: practiceName.trim() } : {}),
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

  if (onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Google profile...
      </div>
    );
  }

  return (
    <div className="medical-gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="medical-card-glow bg-card w-full max-w-md space-y-4 rounded-xl border p-6">
        <div>
          <h1 className="text-primary text-2xl font-bold">Solo practice registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your own practice workspace. You can invite staff and clients after signup.
          </p>
        </div>

        {!isGoogleOnboarding ? (
          <>
            <GoogleSignInButton persona="provider" providerType="individual" />
            <AuthDivider />
          </>
        ) : null}

        {onboardingError ? <p className="text-sm text-red-600">{onboardingError}</p> : null}

        {isOtpStep && pending ? (
          <OtpVerificationForm
            pending={pending}
            onVerified={completeAuth}
            onBack={clearOtp}
            successMessage="Your solo practice is ready"
          />
        ) : (
          <RegisterSoloForm
            loading={loading}
            apiError={apiError}
            googleToken={googleToken}
            hidePassword={isGoogleOnboarding}
            emailLocked={isGoogleOnboarding}
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

export default function RegisterSoloPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <RegisterSoloContent />
    </Suspense>
  );
}
