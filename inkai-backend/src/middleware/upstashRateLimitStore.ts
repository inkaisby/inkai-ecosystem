import { Redis } from '@upstash/redis';
import type { IncrementResponse, Options, Store } from 'express-rate-limit';

let sharedClient: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (!sharedClient) {
    sharedClient = new Redis({ url, token });
  }
  return sharedClient;
}

/**
 * Store untuk express-rate-limit: counter per jendela tetap (fixed window),
 * konsisten di semua instance serverless.
 */
function createUpstashStore(keyPrefix: string): Store {
  let windowMs = 15 * 60 * 1000;

  const bucketKey = (clientKey: string): string => {
    const now = Date.now();
    const period = Math.floor(now / windowMs);
    return `${keyPrefix}:${clientKey}:${period}`;
  };

  const resetTimeForCurrentWindow = (): Date => {
    const period = Math.floor(Date.now() / windowMs);
    return new Date((period + 1) * windowMs);
  };

  return {
    localKeys: false,
    prefix: keyPrefix,

    init(options: Options): void {
      windowMs = options.windowMs;
    },

    async increment(key: string): Promise<IncrementResponse> {
      const redis = getRedis();
      if (!redis) {
        throw new Error('[RateLimit] Upstash tidak tersedia');
      }
      const bk = bucketKey(key);
      const totalHits = await redis.incr(bk);
      if (totalHits === 1) {
        await redis.expire(bk, Math.ceil(windowMs / 1000) + 5);
      }
      return { totalHits, resetTime: resetTimeForCurrentWindow() };
    },

    async decrement(key: string): Promise<void> {
      const redis = getRedis();
      if (!redis) return;
      const bk = bucketKey(key);
      const n = await redis.decr(bk);
      if (n < 0) {
        await redis.set(bk, '0', { ex: Math.ceil(windowMs / 1000) + 5 });
      }
    },

    async resetKey(key: string): Promise<void> {
      const redis = getRedis();
      if (!redis) return;
      await redis.del(bucketKey(key));
    },

    async get(key: string): Promise<IncrementResponse | undefined> {
      const redis = getRedis();
      if (!redis) return undefined;
      const raw = await redis.get<number>(bucketKey(key));
      const totalHits =
        typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10) || 0;
      return { totalHits, resetTime: resetTimeForCurrentWindow() };
    },
  };
}

/** Store login jika Upstash terkonfigurasi; jika tidak, gunakan default memory di rateLimit(). */
export function getAuthLoginRateLimitStore(): Store | undefined {
  if (!getRedis()) return undefined;
  return createUpstashStore('inkai:rl:auth_login');
}
