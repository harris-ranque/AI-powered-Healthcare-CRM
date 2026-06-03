'use client';

import type { AuthPersona, ProviderType } from '../types/persona.type';
import { buildGoogleAuthUrl } from '../utils/google-auth-url';

type Props = {
  persona: AuthPersona;
  providerType?: ProviderType;
  disabled?: boolean;
  label?: string;
};

export function GoogleSignInButton({
  persona,
  providerType = 'organization',
  disabled,
  label = 'Continue with Google',
}: Props) {
  const handleClick = () => {
    window.location.href = buildGoogleAuthUrl(persona, providerType);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded border border-zinc-300 bg-white p-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.7s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.7H12z"
        />
        <path
          fill="#34A853"
          d="M3.6 7.4l3.2 2.3C7.7 7.7 9.7 6.1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"
        />
        <path
          fill="#FBBC05"
          d="M12 21.5c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 1-3.3 1-2.5 0-4.7-1.7-5.5-4l-3.2 2.5c1.5 3.1 4.8 5.3 8.7 5.3z"
        />
        <path
          fill="#4285F4"
          d="M21.6 12.5c0-.6-.1-1.1-.2-1.7H12v3.9h5.5c-.3 1.4-1 2.5-2.2 3.3l3.1 2.4c1.8-1.7 3.2-4.2 3.2-7.9z"
        />
      </svg>
      {label}
    </button>
  );
}
