export type AuthUser = {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR';
};