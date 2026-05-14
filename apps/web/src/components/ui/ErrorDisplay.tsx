/**
 * Error Display Components
 *
 * User-friendly error messages and error states
 */

'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, getErrorMessage } from '@/lib/utils';

interface ErrorDisplayProps {
  error: Error | string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, title, onRetry, className }: ErrorDisplayProps) {
  const message = error ? getErrorMessage(error) : 'An error occurred';

  return (
    <div className={cn('rounded-lg border border-red-200 bg-red-50 p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>}
          <p className="text-sm text-red-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Full page error display
 */
export function ErrorPage({ error, onRetry }: { error: Error | string; onRetry?: () => void }) {
  const router = useRouter();
  const message = getErrorMessage(error);

  return (
    <div className="flex min-h-[400px] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message (e.g., for form fields)
 */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-600', className)}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Empty state display (when no data found)
 */
export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  actionLabel,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-[300px] items-center justify-center px-4', className)}>
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Icon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="mb-6 text-gray-600">{description}</p>}
        {action && actionLabel && (
          <button
            onClick={action}
            className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Transaction error toast/banner
 */
export function TransactionError({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900">Transaction Failed</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600"
          aria-label="Dismiss"
        >
          <span className="text-xl">×</span>
        </button>
      </div>
    </div>
  );
}
