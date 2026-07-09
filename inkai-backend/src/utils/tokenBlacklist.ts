import crypto from 'crypto';

// In-memory fallback when Redis is not available
const memoryBlacklist = new Map<string, number>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
}

function getRedis(): any | null {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) return null;
    // Dynamic import to avoid crash if @upstash/redis is not installed
    const { Redis } = require('@upstash/redis');
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

/**
 * Blacklist a JWT token so it can no longer be used.
 * @param token The raw JWT string
 * @param expiresInSeconds How long to keep in blacklist (should match JWT remaining TTL)
 */
export async function blacklistToken(token: string, expiresInSeconds: number = 86400): Promise<void> {
  const key = `inkai:bl:${hashToken(token)}`;
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, '1', { ex: expiresInSeconds });
      return;
    } catch (err) {
      console.error('[TokenBlacklist] Redis error, falling back to memory:', err);
    }
  }
  // Fallback: in-memory
  memoryBlacklist.set(key, Date.now() + expiresInSeconds * 1000);
}

/**
 * Check if a token has been blacklisted.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `inkai:bl:${hashToken(token)}`;
  const redis = getRedis();
  if (redis) {
    try {
      const val = await redis.get(key);
      return val !== null;
    } catch {
      // Fall through to memory check
    }
  }
  // Fallback: in-memory
  const expiry = memoryBlacklist.get(key);
  if (expiry) {
    if (Date.now() < expiry) return true;
    memoryBlacklist.delete(key);
  }
  return false;
}

// Periodic cleanup of expired in-memory entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of memoryBlacklist) {
    if (now >= expiry) memoryBlacklist.delete(key);
  }
}, 5 * 60 * 1000).unref();
