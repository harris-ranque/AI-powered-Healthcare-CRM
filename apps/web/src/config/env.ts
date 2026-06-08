import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string(),
    // Set to "true" when the frontend and API are on different sites
    // (e.g. Vercel frontend + ngrok/hosted API) so auth restore always
    // attempts a refresh instead of reading the API-domain session cookie.
    NEXT_PUBLIC_CROSS_SITE: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_CROSS_SITE: process.env.NEXT_PUBLIC_CROSS_SITE,
  },
});