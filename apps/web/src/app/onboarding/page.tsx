'use client';

import { Suspense } from 'react';

import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
