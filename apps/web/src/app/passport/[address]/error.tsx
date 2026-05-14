'use client';

import { ErrorPage } from '@/components/ui';

export default function PassportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} onRetry={reset} />;
}
