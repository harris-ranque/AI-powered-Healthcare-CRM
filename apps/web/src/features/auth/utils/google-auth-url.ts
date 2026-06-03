import { env } from '@/config/env';

import type { AuthPersona, ProviderType } from '../types/persona.type';

export function buildGoogleAuthUrl(
  persona: AuthPersona,
  providerType: ProviderType = 'organization',
): string {
  const params = new URLSearchParams({ persona });
  if (persona === 'provider') {
    params.set(
      'providerType',
      providerType === 'individual' ? 'individual' : 'org',
    );
  }
  return `${env.NEXT_PUBLIC_API_URL}/auth/google?${params.toString()}`;
}
