import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: isProd ? 0.1 : 1.0,
    profilesSampleRate: isProd ? 0.1 : 1.0,
  });
}
