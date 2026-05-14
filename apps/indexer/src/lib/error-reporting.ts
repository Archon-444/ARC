/**
 * Thin error-reporting shim for the backend.
 *
 * If @sentry/node is installed and initialized (e.g. via `Sentry.init({ dsn: ... })`
 * in server.ts), errors are forwarded via `Sentry.captureException`. Otherwise
 * we just `console.error`. This lets us wire the call site without forcing the
 * SDK as a hard dep.
 */

type SentryLikeClient = { captureException: (err: unknown, hint?: unknown) => void };

function tryRequireSentry(): SentryLikeClient | null {
  if (!process.env.SENTRY_DSN) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@sentry/node');
    if (mod && typeof mod.captureException === 'function') {
      return mod as SentryLikeClient;
    }
  } catch {
    // Module not installed; fall through.
  }
  return null;
}

const client = tryRequireSentry();

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (client) {
    client.captureException(error, context ? { extra: context } : undefined);
    return;
  }
  console.error('[reportError]', error, context ?? '');
}
