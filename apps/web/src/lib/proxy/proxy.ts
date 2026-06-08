import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { CLIENT_SESSION_COOKIE } from '@/features/auth/utils/client-session-hint';

const staffProtectedPrefixes = ['/dashboard', '/onboarding'];
const portalProtectedPrefixes = ['/portal'];
const authRoutes = ['/login', '/register'];

const isCrossSiteDeploy = process.env.NEXT_PUBLIC_CROSS_SITE === 'true';

/** Treat cookie as a session only if the JWT is present and not expired. */
function hasValidRefreshCookie(request: NextRequest): boolean {
  const token = request.cookies.get('refresh_token')?.value;
  if (!token) {
    return false;
  }

  try {
    const segment = token.split('.')[1] ?? '';
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Cross-site: refresh_token is on the API host; use a first-party hint on the frontend. */
function hasCrossSiteSession(request: NextRequest): boolean {
  return request.cookies.get(CLIENT_SESSION_COOKIE)?.value === '1';
}

function hasSession(request: NextRequest): boolean {
  if (isCrossSiteDeploy) {
    return hasCrossSiteSession(request);
  }
  return hasValidRefreshCookie(request);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = hasSession(request);

  const isStaffProtected = staffProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isPortalProtected = portalProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthPage =
    authRoutes.includes(pathname) || pathname.startsWith('/register/');

  if ((isStaffProtected || isPortalProtected) && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && hasSessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
