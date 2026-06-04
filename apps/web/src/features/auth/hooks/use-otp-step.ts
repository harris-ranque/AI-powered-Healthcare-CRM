'use client';

import { useCallback, useState } from 'react';

import type { OtpPendingResponse } from '../types/otp.type';

export function useOtpStep() {
  const [pending, setPending] = useState<OtpPendingResponse | null>(null);

  const startOtp = useCallback((response: OtpPendingResponse) => {
    setPending(response);
  }, []);

  const clearOtp = useCallback(() => {
    setPending(null);
  }, []);

  return {
    pending,
    isOtpStep: pending !== null,
    startOtp,
    clearOtp,
  };
}
