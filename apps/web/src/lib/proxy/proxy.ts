import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshCookie = request.cookies.has('refresh_token');

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authRoutes.includes(pathname);

  if (isProtected && !hasRefreshCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && hasRefreshCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
