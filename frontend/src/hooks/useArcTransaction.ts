/**
 * React Hooks for Arc SDK Integration
 * Provides Arc-native blockchain functionality with React state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getArcTxStatus,
  waitForArcTxFinality,
  monitorTransaction,
  ArcTxStatus,
} from '@/lib/arc-utils';

/**
 * Hook to monitor Arc transaction status with automatic finality tracking
 *
 * @param txHash - Transaction hash to monitor
 * @param options - Configuration options
 * @returns Transaction status, loading state, and error
 *
 * @example
 * ```tsx
 * function TransactionMonitor({ txHash }: { txHash: string }) {
 *   const { status, loading, error } = useArcTransaction(txHash);
 *
 *   if (loading) return <div>Confirming transaction...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!status) return null;
 *
 *   return (
 *     <div>
 *       <p>Status: {status.status}</p>
 *       <p>Finalized: {status.isFinalized ? 'Yes' : 'No'}</p>
 *       <p>Finality Time: {status.finalityTime}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcTransaction(
  txHash?: string,
  options: {
    enabled?: boolean;
    pollInterval?: number;
    timeout?: number;
    onFinalized?: (status: ArcTxStatus) => void;
  } = {}
) {
  const {
    enabled = true,
    pollInterval = 1000,
    timeout = 60000,
    onFinalized,
  } = options;

  const [status, setStatus] = useState<ArcTxStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!txHash || !enabled) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Monitor transaction with callback
    const controller = new AbortController();

    monitorTransaction(
      txHash,
      (newStatus) => {
        setStatus(newStatus);

        if (newStatus.isFinalized) {
          setLoading(false);
          onFinalized?.(newStatus);
        }
      },
      pollInterval,
      timeout
    ).catch((err) => {
      setError(err);
      setLoading(false);
    });

    return () => {
      controller.abort();
    };
  }, [txHash, enabled, pollInterval, timeout, onFinalized]);

  return { status, loading, error };
}

/**
 * Hook to get transaction status once (no polling)
 * Useful for historical transactions or one-time checks
 *
 * @param txHash - Transaction hash
 * @returns Transaction status, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function TransactionDetails({ txHash }: { txHash: string }) {
 *   const { status, loading, refetch } = useArcTransactionOnce(txHash);
 *
 *   return (
 *     <div>
 *       {loading ? 'Loading...' : status?.status}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcTransactionOnce(txHash?: string) {
  const [status, setStatus] = useState<ArcTxStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!txHash) return;

    setLoading(true);
    setError(null);

    try {
      const txStatus = await getArcTxStatus(txHash);
      setStatus(txStatus);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [txHash]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
}

/**
 * Hook to wait for transaction finality
 * Returns a function that can be called to wait for a transaction
 *
 * @returns Function to wait for finality, loading state, error, and result
 *
 * @example
 * ```tsx
 * function BuyNFT() {
 *   const { waitForFinality, loading, result } = useWaitForArcTxFinality();
 *
 *   const handleBuy = async () => {
 *     const tx = await buyItem(collectionAddress, tokenId);
 *     const finalStatus = await waitForFinality(tx.hash);
 *
 *     if (finalStatus.status === 'success') {
 *       alert('NFT purchased successfully!');
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleBuy} disabled={loading}>
 *       {loading ? 'Processing...' : 'Buy NFT'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWaitForArcTxFinality(options: { timeout?: number } = {}) {
  const { timeout = 30000 } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ArcTxStatus | null>(null);

  const waitForFinality = useCallback(
    async (txHash: string): Promise<ArcTxStatus> => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const finalStatus = await waitForArcTxFinality(txHash, timeout);
        setResult(finalStatus);
        return finalStatus;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [timeout]
  );

  return {
    waitForFinality,
    loading,
    error,
    result,
  };
}

/**
 * Hook to get multiple transaction statuses
 * Useful for displaying transaction history
 *
 * @param txHashes - Array of transaction hashes
 * @returns Array of transaction statuses, loading state, and error
 *
 * @example
 * ```tsx
 * function TransactionHistory({ txHashes }: { txHashes: string[] }) {
 *   const { statuses, loading } = useArcTransactionBatch(txHashes);
 *
 *   if (loading) return <div>Loading transactions...</div>;
 *
 *   return (
 *     <div>
 *       {statuses.map((status, i) => (
 *         <div key={i}>
 *           {txHashes[i]}: {status?.status || 'Unknown'}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcTransactionBatch(txHashes: string[]) {
  const [statuses, setStatuses] = useState<(ArcTxStatus | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (txHashes.length === 0) {
      setStatuses([]);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      txHashes.map((hash) =>
        getArcTxStatus(hash).catch((err) => {
          console.error(`Failed to get status for ${hash}:`, err);
          return null;
        })
      )
    )
      .then(setStatuses)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(txHashes)]); // Use JSON.stringify for array comparison

  return { statuses, loading, error };
}
