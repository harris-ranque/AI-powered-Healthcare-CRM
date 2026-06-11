export { proxy } from './lib/proxy/proxy';

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard/:path*',
    '/portal/:path*',
    '/onboarding',
    '/onboarding/:path*',
    '/login',
    '/register',
    '/register/:path*',
  ],
};
