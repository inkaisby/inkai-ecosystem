import { Request } from 'express';
import { captureSafeException } from './sentry';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_BLOCKED_RATE_LIMIT'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'TOKEN_REVOKED'
  | 'UNAUTHORIZED_ACCESS'
  | 'FORBIDDEN_ACCESS'
  | 'SUSPICIOUS_INPUT'
  | 'FILE_UPLOAD'
  | 'ROLE_CHANGED'
  | 'MEMBER_CREATED'
  | 'MEMBER_DELETED'
  | 'ADMIN_ACTION'
  | 'BRUTE_FORCE_DETECTED'
  | 'CORS_VIOLATION';

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  ip: string;
  userAgent: string;
  userId?: string;
  targetId?: string;
  path: string;
  method: string;
  details?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// In-memory buffer for failed login tracking per user
const failedLoginTracker = new Map<string, { count: number; lastAttempt: number }>();

function extractClientInfo(req: Request) {
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: (req.headers['user-agent'] || 'unknown').slice(0, 200),
    path: req.originalUrl || req.path,
    method: req.method,
  };
}

/**
 * Log a security event to console (structured JSON) and Sentry for critical events.
 */
export function logSecurityEvent(req: Request, type: SecurityEventType, opts: {
  userId?: string;
  targetId?: string;
  details?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} = {}): void {
  const client = extractClientInfo(req);
  const severity = opts.severity || inferSeverity(type);

  const event: SecurityEvent = {
    type,
    timestamp: new Date().toISOString(),
    ip: client.ip,
    userAgent: client.userAgent,
    userId: opts.userId,
    targetId: opts.targetId,
    path: client.path,
    method: client.method,
    details: opts.details,
    severity,
  };

  // Structured JSON log — easy to parse by log aggregators (Vercel, Datadog, etc.)
  console.log(JSON.stringify({ _security: true, ...event }));

  // Send critical events to Sentry
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    try {
      captureSafeException(
        new Error(`[SECURITY] ${type}: ${opts.details || 'No details'}`),
        { ...client, userId: opts.userId, severity }
      );
    } catch {
      // Sentry not available — ignore
    }
  }
}

/**
 * Track failed login attempts per identifier and detect brute force.
 * Returns true if the account should be locked.
 */
export function trackFailedLogin(identifier: string): { shouldLock: boolean; attempts: number } {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

  const now = Date.now();
  const tracker = failedLoginTracker.get(identifier);

  if (!tracker || now - tracker.lastAttempt > WINDOW_MS) {
    failedLoginTracker.set(identifier, { count: 1, lastAttempt: now });
    return { shouldLock: false, attempts: 1 };
  }

  tracker.count += 1;
  tracker.lastAttempt = now;

  return { shouldLock: tracker.count >= MAX_ATTEMPTS, attempts: tracker.count };
}

/**
 * Reset failed login counter (on successful login).
 */
export function resetFailedLogins(identifier: string): void {
  failedLoginTracker.delete(identifier);
}

/**
 * Check if an identifier is currently locked out.
 */
export function isAccountLocked(identifier: string): boolean {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 30 * 60 * 1000;

  const tracker = failedLoginTracker.get(identifier);
  if (!tracker) return false;

  if (Date.now() - tracker.lastAttempt > WINDOW_MS) {
    failedLoginTracker.delete(identifier);
    return false;
  }

  return tracker.count >= MAX_ATTEMPTS;
}

function inferSeverity(type: SecurityEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (type) {
    case 'BRUTE_FORCE_DETECTED':
    case 'ACCOUNT_LOCKED':
      return 'CRITICAL';
    case 'LOGIN_FAILED':
    case 'UNAUTHORIZED_ACCESS':
    case 'FORBIDDEN_ACCESS':
    case 'SUSPICIOUS_INPUT':
    case 'CORS_VIOLATION':
      return 'HIGH';
    case 'PASSWORD_CHANGED':
    case 'PASSWORD_RESET_REQUESTED':
    case 'PASSWORD_RESET_COMPLETED':
    case 'TOKEN_REVOKED':
    case 'ROLE_CHANGED':
    case 'MEMBER_DELETED':
    case 'ADMIN_ACTION':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const WINDOW_MS = 30 * 60 * 1000;
  for (const [key, val] of failedLoginTracker) {
    if (now - val.lastAttempt > WINDOW_MS) failedLoginTracker.delete(key);
  }
}, 10 * 60 * 1000).unref();
