'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/features/auth/api/auth.api';
import type { OtpPendingResponse } from '@/features/auth/types/otp.type';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

type Props = {
  pending: OtpPendingResponse;
  onVerified: (accessToken: string) => void | Promise<void>;
  onBack?: () => void;
  successMessage?: string;
};

export function OtpVerificationForm({
  pending,
  onVerified,
  onBack,
  successMessage = 'Verification successful',
}: Props) {
  const notify = useNotificationStore((state) => state.notify);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [session, setSession] = useState(pending);

  const handleVerify = async () => {
    if (code.length !== 6) {
      return;
    }
    try {
      setLoading(true);
      const data = await authApi.verifyOtp(session.otpSessionId, code);
      notify({ type: 'success', message: successMessage });
      await onVerified(data.access_token);
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Invalid or expired code'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const next = await authApi.resendOtp(session.otpSessionId);
      setSession(next);
      setCode('');
      notify({ type: 'success', message: 'A new code was sent to your email' });
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not resend code'),
      });
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.ceil(session.expiresIn / 60);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          We sent a 6-digit code to <strong>{session.email}</strong>. Enter it below to
          continue. The code expires in about {minutes} minutes.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          If you do not receive an email, ask your admin to configure SMTP in the API
          or check API logs when SMTP is not set.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-code">Verification code</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={loading || code.length !== 6}
        onClick={() => void handleVerify()}
      >
        {loading ? 'Verifying...' : 'Verify and continue'}
      </Button>

      <div className="flex flex-col gap-2 text-center text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground underline disabled:opacity-50"
          disabled={resending}
          onClick={() => void handleResend()}
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
        {onBack ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground underline"
            onClick={onBack}
          >
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}
