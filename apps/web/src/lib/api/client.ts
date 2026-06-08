'use client';

import axios from 'axios';
import { env } from '@/config/env';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  // Bypass the ngrok free-tier browser interstitial for XHR/fetch requests.
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});
