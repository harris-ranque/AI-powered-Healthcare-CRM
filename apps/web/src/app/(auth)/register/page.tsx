'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AuthDivider } from '@/features/auth/components/auth-divider';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { PersonaToggle } from '@/features/auth/components/persona-toggle';
import { Button } from '@/components/ui/button';
import type { AuthPersona, ProviderType } from '@/features/auth/types/persona.type';

export default function RegisterPage() {
  const [persona, setPersona] = useState<AuthPersona>('client');
  const [providerType, setProviderType] = useState<ProviderType>('organization');

  const emailRegisterHref =
    persona === 'client'
      ? '/register/client'
      : providerType === 'individual'
        ? '/register/staff'
        : '/register/clinic';

  return (
    <div className="medical-gradient-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Register as a client (patient) or healthcare provider.
          </p>
        </div>

        <PersonaToggle
          persona={persona}
          onPersonaChange={setPersona}
          providerType={providerType}
          onProviderTypeChange={setProviderType}
          showProviderSubType
        />

        <GoogleSignInButton persona={persona} providerType={providerType} />

        <AuthDivider />

        <Button asChild className="w-full" variant="outline">
          <Link href={emailRegisterHref}>Register with email</Link>
        </Button>

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
