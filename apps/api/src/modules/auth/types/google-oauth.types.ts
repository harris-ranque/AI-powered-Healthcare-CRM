import type { User } from '@prisma/client';

export type GoogleProfileInput = {
  googleId: string;
  email: string;
  name?: string;
};

export type OAuthPersona = 'client' | 'provider';

export type ProviderType = 'org' | 'individual';

export type GoogleOAuthState = {
  persona: OAuthPersona;
  providerType?: ProviderType;
};

export type GoogleValidatedResult = {
  user: User | null;
  profile: GoogleProfileInput;
};

export type GoogleOnboardingPayload = {
  purpose: 'google_onboarding';
  googleId: string;
  email: string;
  name?: string;
};

export type GoogleOnboardingResponse = {
  email: string;
  name?: string;
};
