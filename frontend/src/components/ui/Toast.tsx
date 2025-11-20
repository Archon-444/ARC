/**
 * Toast Notification System
 *
 * Provides real-time transaction feedback and notifications
 */

'use client';

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getTransactionUrl } from '@/lib/utils';
import { toastVariants } from '@/lib/animations';
import type { TransactionHash } from '@/types';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'pending';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txHash?: TransactionHash;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0 && toast.type !== 'pending') {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.type, toast.id, onDismiss]);

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
    pending: Loader2,
  }[toast.type];

  const colorClasses = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
    pending: 'border-blue-200 bg-blue-50',
  }[toast.type];

  const iconClasses = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    pending: 'text-blue-600 animate-spin',
  }[toast.type];

  const titleClasses = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
    pending: 'text-blue-900',
  }[toast.type];

  const descriptionClasses = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
    pending: 'text-blue-700',
  }[toast.type];

  return (
    <motion.div
      variants={toastVariants('top')}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg',
        colorClasses
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 flex-shrink-0', iconClasses)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', titleClasses)}>{toast.title}</p>
            {toast.description && (
              <p className={cn('mt-1 text-xs', descriptionClasses)}>{toast.description}</p>
            )}
            {toast.txHash && (
              <a
                href={getTransactionUrl(toast.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('mt-2 inline-flex items-center gap-1 text-xs hover:underline', descriptionClasses)}
              >
                View transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className={cn('flex-shrink-0 rounded-md p-1 hover:bg-black/5', descriptionClasses)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({ toasts, onDismiss, position = 'top-right' }: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }[position];

  if (toasts.length === 0) return null;

  return (
    <div className={cn('pointer-events-none fixed z-50 flex flex-col gap-3', positionClasses)}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Transaction Toast - Specialized toast for transaction tracking
 */
export interface TransactionToast {
  id: string;
  txHash: TransactionHash;
  status: 'pending' | 'success' | 'error';
  title: string;
  errorMessage?: string;
}

export function createTransactionToast(
  txHash: TransactionHash,
  title: string,
  status: 'pending' | 'success' | 'error' = 'pending',
  errorMessage?: string
): Toast {
  const descriptions = {
    pending: 'Transaction is being processed...',
    success: 'Transaction confirmed successfully',
    error: errorMessage || 'Transaction failed',
  };

  return {
    id: txHash,
    type: status === 'error' ? 'error' : status === 'success' ? 'success' : 'pending',
    title,
    description: descriptions[status],
    txHash,
    duration: status === 'pending' ? 0 : 5000, // Don't auto-dismiss pending toasts
  };
}

/**
 * Simple toast utilities for common scenarios
 */
export function createSuccessToast(title: string, description?: string, duration = 5000): Toast {
  return {
    id: `success-${Date.now()}`,
    type: 'success',
    title,
    description,
    duration,
  };
}

export function createErrorToast(title: string, description?: string, duration = 7000): Toast {
  return {
    id: `error-${Date.now()}`,
    type: 'error',
    title,
    description,
    duration,
  };
}

export function createInfoToast(title: string, description?: string, duration = 5000): Toast {
  return {
    id: `info-${Date.now()}`,
    type: 'info',
    title,
    description,
    duration,
  };
}

export function createWarningToast(title: string, description?: string, duration = 6000): Toast {
  return {
    id: `warning-${Date.now()}`,
    type: 'warning',
    title,
    description,
    duration,
  };
}

/**
 * Toast Context and Provider
 *
 * Provides a simple API for showing toasts from anywhere in the app
 */
interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast(createSuccessToast(title, description));
  }, [showToast]);

  const showError = useCallback((title: string, description?: string) => {
    showToast(createErrorToast(title, description));
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string) => {
    showToast(createInfoToast(title, description));
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string) => {
    showToast(createWarningToast(title, description));
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
