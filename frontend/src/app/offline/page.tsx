/**
 * Offline Page
 *
 * Displayed when the PWA is offline and the requested page is not cached
 */

import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-neutral-200 p-6 dark:bg-neutral-800">
            <WifiOff className="h-16 w-16 text-neutral-400" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          You're Offline
        </h1>

        <p className="mb-6 text-neutral-600 dark:text-neutral-300">
          It looks like you've lost your internet connection.
          <br />
          Please check your connection and try again.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
        >
          Return Home
        </Link>

        <p className="mt-6 text-sm text-neutral-500">
          Some content may still be available from your cache.
        </p>
      </div>
    </div>
  );
}
