export { proxy } from './lib/proxy/proxy';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
    '/register/:path*',
  ],
};
