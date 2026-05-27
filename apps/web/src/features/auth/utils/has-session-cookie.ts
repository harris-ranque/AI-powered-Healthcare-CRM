/** Readable hint set by the API when a refresh-token session exists (httpOnly cookie is not visible to JS). */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie.split(';').some((part) => part.trim().startsWith('has_session='));
}
