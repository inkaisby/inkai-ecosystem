import rateLimit from 'express-rate-limit';
import { getAuthLoginRateLimitStore } from './upstashRateLimitStore';

const parseWindowMs = () => {
  const raw = Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 15 * 60 * 1000;
};

const parseMax = () => {
  const raw = Number(process.env.AUTH_LOGIN_RATE_MAX_REQUESTS);
  return Number.isFinite(raw) && raw > 0 ? raw : 25;
};

const behindTrustedProxy =
  !!process.env.VERCEL || process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';

const redisStore = getAuthLoginRateLimitStore();
const failOpenOnStoreError =
  process.env.AUTH_LOGIN_PASS_ON_STORE_ERROR !== 'false';

/**
 * Batas percobaan login / admin-login per IP (+ XFF jika proxy dipercaya — Vercel).
 * Dengan `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, counter dibagi antar instance Vercel.
 */
export const authLoginLimiter = rateLimit({
  windowMs: parseWindowMs(),
  limit: parseMax(),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ...(redisStore ? { store: redisStore, passOnStoreError: failOpenOnStoreError } : {}),
  message: {
    status: 'error',
    message:
      'Terlalu banyak percobaan dari alamat ini. Silakan tunggu beberapa menit lalu coba lagi.',
  },
  validate: behindTrustedProxy ? { trustProxy: false } : true,
});
