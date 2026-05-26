import { RateLimiterRedis } from 'rate-limiter-flexible';

import { getRedis } from '../redis/redis.provider';

let limiter: RateLimiterRedis | null = null;

export function getLoginRateLimiter(): RateLimiterRedis {
  if (!limiter) {
    limiter = new RateLimiterRedis({
      storeClient: getRedis(),
      keyPrefix: 'login_fail',
      points: 5,
      duration: 60 * 15,
      blockDuration: 60 * 30,
    });
  }
  return limiter;
}
