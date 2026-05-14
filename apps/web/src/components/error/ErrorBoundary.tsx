/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components
 * Displays fallback UI and logs errors
 * Includes retry functionality
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo,
    });

    // In production, you would send this to an error reporting service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 inline-flex rounded-full bg-red-100 p-4 dark:bg-red-900/30">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              We encountered an unexpected error. Please try refreshing the page or going back home.
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900">
                <summary className="cursor-pointer font-semibold text-neutral-900 dark:text-white">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReset}
                variant="primary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                leftIcon={<Home className="h-4 w-4" />}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary Hook
 * For catching errors in async operations
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError };
}

/**
 * Page-level Error Component
 * For use in Next.js error.tsx files
 */
export function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          Page Error
        </h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          This page encountered an error. Please try again.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900">
            <summary className="cursor-pointer font-semibold">Error Details</summary>
            <pre className="mt-2 overflow-auto text-xs text-red-600">
              {error.message}
            </pre>
          </details>
        )}

        <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
