import type {
  GoogleOAuthState,
  OAuthPersona,
  ProviderType,
} from '../types/google-oauth.types';

export function encodeGoogleOAuthState(state: GoogleOAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

export function decodeGoogleOAuthState(raw: unknown): GoogleOAuthState {
  if (typeof raw !== 'string' || !raw) {
    return { persona: 'client', providerType: 'org' };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    ) as Partial<GoogleOAuthState>;

    const persona: OAuthPersona =
      parsed.persona === 'provider' ? 'provider' : 'client';
    const providerType: ProviderType =
      parsed.providerType === 'individual' ? 'individual' : 'org';

    return { persona, providerType };
  } catch {
    return { persona: 'client', providerType: 'org' };
  }
}

export function getRegisterPathForOAuthState(state: GoogleOAuthState): string {
  if (state.persona === 'client') {
    return '/register/client';
  }
  if (state.providerType === 'individual') {
    return '/register/staff';
  }
  return '/register/clinic';
}
