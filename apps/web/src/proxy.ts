export { proxy } from './lib/proxy/proxy';

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
