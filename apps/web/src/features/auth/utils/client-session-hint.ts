/** Cookie name read by Next.js middleware in cross-site deploys (Vercel + hosted API). */
export const CLIENT_SESSION_COOKIE = 'session_active';

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Marks an active session on the frontend domain (refresh token lives on the API domain). */
export function setClientSessionHint(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CLIENT_SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearClientSessionHint(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CLIENT_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

export function hasClientSessionHint(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${CLIENT_SESSION_COOKIE}=1`));
}
