import Redis from 'ioredis';

// Lazy singleton: created on first call, NOT at module import time.
// This matters because module imports run before ConfigModule loads .env,
// so reading process.env.REDIS_PORT eagerly would yield NaN.
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }
  return client;
}
