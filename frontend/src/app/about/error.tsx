'use client';

import { ErrorPage } from '@/components/ui/ErrorDisplay';

export default function AboutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} onRetry={reset} />;
}
