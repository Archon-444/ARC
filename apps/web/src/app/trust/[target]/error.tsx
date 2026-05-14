'use client';

import { ErrorPage } from '@/components/ui';

export default function TrustError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} onRetry={reset} />;
}
