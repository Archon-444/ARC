/**
 * Toast Hook
 *
 * Global toast management with React Context
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, Toast, createSuccessToast, createErrorToast, createInfoToast, createWarningToast, createTransactionToast } from '@/components/ui/Toast';
import type { TransactionHash } from '@/types';

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  transaction: (txHash: TransactionHash, title: string, status?: 'pending' | 'success' | 'error', errorMessage?: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast(createSuccessToast(title, description));
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast(createErrorToast(title, description));
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast(createInfoToast(title, description));
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast(createWarningToast(title, description));
  }, [addToast]);

  const transaction = useCallback((
    txHash: TransactionHash,
    title: string,
    status: 'pending' | 'success' | 'error' = 'pending',
    errorMessage?: string
  ) => {
    const toast = createTransactionToast(txHash, title, status, errorMessage);

    // Check if toast already exists
    const existingToast = toasts.find((t) => t.id === txHash);
    if (existingToast) {
      updateToast(txHash, toast);
    } else {
      addToast(toast);
    }
  }, [addToast, updateToast, toasts]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        info,
        warning,
        transaction,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Transaction tracking hook
 * Automatically updates toast based on transaction status
 */
export function useTransactionToast() {
  const { transaction, updateToast } = useToast();

  const trackTransaction = useCallback(
    (txHash: TransactionHash, title: string) => {
      // Create pending toast
      transaction(txHash, title, 'pending');

      return {
        onSuccess: () => {
          updateToast(txHash, {
            type: 'success',
            title: `${title} - Success`,
            description: 'Transaction confirmed successfully',
            duration: 5000,
          });
        },
        onError: (errorMessage?: string) => {
          updateToast(txHash, {
            type: 'error',
            title: `${title} - Failed`,
            description: errorMessage || 'Transaction failed',
            duration: 7000,
          });
        },
      };
    },
    [transaction, updateToast]
  );

  return { trackTransaction };
}
