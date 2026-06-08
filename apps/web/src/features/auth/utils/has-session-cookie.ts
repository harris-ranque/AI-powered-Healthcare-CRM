import { env } from '@/config/env';

/** Readable hint set by the API when a refresh-token session exists (httpOnly cookie is not visible to JS). */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  // Cross-site deploys (e.g. Vercel frontend + hosted API): the has_session
  // hint cookie is scoped to the API domain and is not readable here, so always
  // attempt a refresh and let it resolve the session.
  if (env.NEXT_PUBLIC_CROSS_SITE === 'true') {
    return true;
  }

  return document.cookie.split(';').some((part) => part.trim().startsWith('has_session='));
}
