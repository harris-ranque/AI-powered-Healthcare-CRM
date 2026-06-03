'use client';

import { Suspense } from 'react';

import LoginPageContent from './login-content';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-zinc-500">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
