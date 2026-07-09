import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logSecurityEvent } from '../utils/securityLogger';

/**
 * Global rate limiter — 100 requests per minute per IP.
 * Protects against DoS and aggressive scraping.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak request. Silakan tunggu sebentar.',
  },
});

/**
 * Sensitive action limiter — 10 requests per 15 minutes per IP.
 * For registration, forgot-password, reset-password, etc.
 */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak percobaan. Silakan tunggu 15 menit.',
  },
});

/**
 * Suspicious pattern list — common attack patterns.
 */
const SUSPICIOUS_PATTERNS = [
  /(<script[^>]*>)/i,
  /(javascript:)/i,
  /(on\w+\s*=)/i,
  /(union\s+(all\s+)?select)/i,
  /(;\s*drop\s+table)/i,
  /(;\s*delete\s+from)/i,
  /(--\s*$)/,
  /(\/\*.*\*\/)/,
  /(\.\.\/)/,
  /(\.\.\\)/,
  /(%2e%2e)/i,
  /(%00)/,
  /(\$\{.*\})/,
  /(\{\{.*\}\})/,
];

/**
 * Check a string for suspicious patterns.
 */
function hasSuspiciousPattern(value: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Recursively scan an object for suspicious patterns.
 */
function scanObject(obj: any, depth = 0): boolean {
  if (depth > 5) return false;
  if (typeof obj === 'string') return hasSuspiciousPattern(obj);
  if (Array.isArray(obj)) return obj.some(item => scanObject(item, depth + 1));
  if (obj && typeof obj === 'object') {
    return Object.values(obj).some(val => scanObject(val, depth + 1));
  }
  return false;
}

/**
 * Strip HTML tags from a string value (basic sanitization).
 */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
}

/**
 * Security CCTV — monitors all requests for suspicious activity.
 * Logs security events and sanitizes input.
 */
export const securityCCTV = (req: Request, res: Response, next: NextFunction) => {
  // 1. Check URL path for suspicious patterns
  if (hasSuspiciousPattern(req.originalUrl)) {
    logSecurityEvent(req, 'SUSPICIOUS_INPUT', {
      details: `Suspicious URL pattern detected: ${req.originalUrl.slice(0, 100)}`,
      severity: 'HIGH',
    });
    return res.status(400).json({ status: 'error', message: 'Request tidak valid' });
  }

  // 2. Check query parameters
  if (req.query && scanObject(req.query)) {
    logSecurityEvent(req, 'SUSPICIOUS_INPUT', {
      details: 'Suspicious query parameter detected',
      severity: 'HIGH',
    });
    return res.status(400).json({ status: 'error', message: 'Request tidak valid' });
  }

  // 3. Sanitize body (don't block, just clean — except for passwords)
  if (req.body && typeof req.body === 'object') {
    // Check for suspicious patterns first
    const bodyWithoutPassword = { ...req.body };
    delete bodyWithoutPassword.password;
    delete bodyWithoutPassword.oldPassword;
    delete bodyWithoutPassword.newPassword;

    if (scanObject(bodyWithoutPassword)) {
      logSecurityEvent(req, 'SUSPICIOUS_INPUT', {
        details: `Suspicious body content detected on ${req.method} ${req.path}`,
        severity: 'MEDIUM',
      });
    }

    // Sanitize all string fields except passwords
    for (const key of Object.keys(req.body)) {
      if (['password', 'oldPassword', 'newPassword', 'passwordHash'].includes(key)) continue;
      if (typeof req.body[key] === 'string') {
        req.body[key] = stripHtml(req.body[key]);
      }
    }
  }

  // 4. Log response status for security monitoring
  const originalSend = res.json.bind(res);
  res.json = function(body: any) {
    if (res.statusCode === 401) {
      logSecurityEvent(req, 'UNAUTHORIZED_ACCESS', {
        details: `401 on ${req.method} ${req.path}`,
      });
    } else if (res.statusCode === 403) {
      logSecurityEvent(req, 'FORBIDDEN_ACCESS', {
        userId: (req as any).user?.userId,
        details: `403 on ${req.method} ${req.path}`,
      });
    }
    return originalSend(body);
  };

  next();
};
