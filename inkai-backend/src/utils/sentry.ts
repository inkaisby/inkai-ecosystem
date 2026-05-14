import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentryBackend(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || initialized) {
    return false;
  }

  const tracesSampleRate = Math.min(
    Math.max(Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'), 0),
    1,
  );

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      'development',
    tracesSampleRate,
    ...(tracesSampleRate > 0 ? { integrations: [Sentry.expressIntegration()] } : {}),
    sendDefaultPii: false,
    release:
      process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA?.slice?.(0, 7),
  });

  initialized = true;
  return true;
}

export function captureSafeException(
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!initialized) return;
  try {
    Sentry.withScope((scope) => {
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(`Thrown: ${String(error)}`, 'error');
      }
    });
  } catch {
    // jangan blokir respons API
  }
}
