import { env } from '@/config/env';

import { hasClientSessionHint } from './client-session-hint';

/** Readable hint set by the API when a refresh-token session exists (httpOnly cookie is not visible to JS). */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  // Cross-site deploys: API cookies are on another host; use the first-party hint.
  if (env.NEXT_PUBLIC_CROSS_SITE === 'true') {
    return hasClientSessionHint();
  }

  return document.cookie.split(';').some((part) => part.trim().startsWith('has_session='));
}
