import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

/**
 * Cache helper to get or set data from Redis
 */
export const getOrSetCache = async <T>(key: string, fetchFn: () => Promise<T>, ttl: number = 3600): Promise<T> => {
  if (!redisUrl || !redisToken) {
    return await fetchFn();
  }

  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`[Cache] Hit: ${key}`);
      return cachedData as T;
    }

    console.log(`[Cache] Miss: ${key}. Fetching from DB...`);
    const freshData = await fetchFn();
    
    // Don't wait for set to complete
    redis.set(key, freshData, { ex: ttl }).catch(err => console.error('[Cache] Set Error:', err));
    
    return freshData;
  } catch (error) {
    console.error('[Cache] Error:', error);
    return await fetchFn();
  }
};

/**
 * Invalidate cache by key
 */
export const invalidateCache = async (key: string) => {
  if (!redisUrl || !redisToken) return;
  try {
    await redis.del(key);
    console.log(`[Cache] Invalidated: ${key}`);
  } catch (error) {
    console.error('[Cache] Invalidation Error:', error);
  }
};
