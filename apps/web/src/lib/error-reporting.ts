/**
 * Thin error-reporting shim.
 *
 * In production, if a global Sentry (or compatible) SDK is loaded via
 * `window.Sentry.captureException`, we forward errors there. Otherwise we
 * fall back to console.error. Wire up @sentry/nextjs via `sentry.client.config.ts`
 * following the official Next.js setup; this file does not require the SDK to
 * be installed.
 */

type ErrorLike = Error | { message?: string; stack?: string } | string | unknown;
type SentryLikeClient = { captureException: (err: unknown, hint?: unknown) => void };

function sentryClient(): SentryLikeClient | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { Sentry?: SentryLikeClient };
  return w.Sentry?.captureException ? w.Sentry : null;
}

export function reportError(error: ErrorLike, context?: Record<string, unknown>) {
  const sentry = sentryClient();
  if (sentry) {
    sentry.captureException(error, context ? { extra: context } : undefined);
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error('[reportError]', error, context ?? '');
  }
}
