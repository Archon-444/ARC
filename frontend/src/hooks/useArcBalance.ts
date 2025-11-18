/**
 * React Hooks for Arc Balance Queries
 * Enhanced balance queries using Arc SDK
 */

import { useState, useEffect, useCallback } from 'react';
import { getUSDCBalance, getArcBalance } from '@/lib/arc-client';
import { batchGetBalances } from '@/lib/arc-utils';
import { formatUSDCAmount } from '@/lib/arc-utils';

/**
 * Hook to get USDC balance with Arc SDK
 * Provides faster queries and better error handling than standard RPC
 *
 * @param address - User address
 * @param options - Configuration options
 * @returns USDC balance, formatted balance, loading state, error, and refetch
 *
 * @example
 * ```tsx
 * function USDCBalance({ address }: { address: string }) {
 *   const { balance, formatted, loading } = useArcUSDCBalance(address, {
 *     refreshInterval: 10000,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>Balance: {formatted} USDC</p>
 *       <p>Raw: {balance?.toString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcUSDCBalance(
  address?: string,
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, refreshInterval = 10000 } = options;

  const [balance, setBalance] = useState<bigint | null>(null);
  const [formatted, setFormatted] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !enabled) {
      setBalance(null);
      setFormatted('0.00');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceHex = await getUSDCBalance(address);
      const balanceBigInt = BigInt(balanceHex);

      setBalance(balanceBigInt);
      setFormatted(formatUSDCAmount(balanceBigInt));
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch USDC balance:', err);
    } finally {
      setLoading(false);
    }
  }, [address, enabled]);

  useEffect(() => {
    fetchBalance();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, refreshInterval]);

  return {
    balance,
    formatted,
    loading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Hook to get native balance (ETH/ARC) with Arc SDK
 *
 * @param address - User address
 * @param options - Configuration options
 * @returns Native balance, formatted balance, loading state, and error
 *
 * @example
 * ```tsx
 * function NativeBalance({ address }: { address: string }) {
 *   const { balance, formatted } = useArcNativeBalance(address);
 *
 *   return <div>Balance: {formatted} ARC</div>;
 * }
 * ```
 */
export function useArcNativeBalance(
  address?: string,
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, refreshInterval = 10000 } = options;

  const [balance, setBalance] = useState<bigint | null>(null);
  const [formatted, setFormatted] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !enabled) {
      setBalance(null);
      setFormatted('0.00');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceHex = await getArcBalance(address);
      const balanceBigInt = BigInt(balanceHex);

      setBalance(balanceBigInt);

      // Format with 18 decimals for native token
      const balanceNumber = Number(balanceBigInt) / 1e18;
      setFormatted(
        balanceNumber.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })
      );
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch native balance:', err);
    } finally {
      setLoading(false);
    }
  }, [address, enabled]);

  useEffect(() => {
    fetchBalance();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, refreshInterval]);

  return {
    balance,
    formatted,
    loading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Hook to get multiple balances at once
 * More efficient than multiple individual queries
 *
 * @param addresses - Array of addresses
 * @returns Map of address to balance, loading state, and error
 *
 * @example
 * ```tsx
 * function MultiBalance({ addresses }: { addresses: string[] }) {
 *   const { balances, loading } = useArcBatchBalances(addresses);
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {Array.from(balances.entries()).map(([addr, balance]) => (
 *         <div key={addr}>
 *           {addr}: {balance}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcBatchBalances(addresses: string[]) {
  const [balances, setBalances] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (addresses.length === 0) {
      setBalances(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    batchGetBalances(addresses)
      .then(setBalances)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(addresses)]); // Use JSON.stringify for array comparison

  return { balances, loading, error };
}

/**
 * Hook to check if user has sufficient USDC balance
 * Useful for transaction validation
 *
 * @param address - User address
 * @param requiredAmount - Required amount in USDC (bigint, 6 decimals)
 * @returns Whether user has sufficient balance, loading state, and current balance
 *
 * @example
 * ```tsx
 * function BuyButton({ price }: { price: bigint }) {
 *   const { address } = useAccount();
 *   const { hasSufficientBalance, loading } = useArcSufficientBalance(
 *     address,
 *     price
 *   );
 *
 *   return (
 *     <button disabled={loading || !hasSufficientBalance}>
 *       {hasSufficientBalance ? 'Buy NFT' : 'Insufficient Balance'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useArcSufficientBalance(
  address?: string,
  requiredAmount?: bigint
) {
  const { balance, loading, error } = useArcUSDCBalance(address);

  const hasSufficientBalance =
    balance !== null && requiredAmount !== undefined
      ? balance >= requiredAmount
      : false;

  const shortfall =
    balance !== null && requiredAmount !== undefined && balance < requiredAmount
      ? requiredAmount - balance
      : 0n;

  return {
    hasSufficientBalance,
    balance,
    shortfall,
    shortfallFormatted: formatUSDCAmount(shortfall),
    loading,
    error,
  };
}

/**
 * Hook to watch balance changes
 * Triggers callback when balance changes
 *
 * @param address - User address
 * @param onChange - Callback when balance changes
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function BalanceWatcher({ address }: { address: string }) {
 *   const [history, setHistory] = useState<bigint[]>([]);
 *
 *   useArcBalanceWatcher(
 *     address,
 *     (newBalance) => {
 *       setHistory(prev => [...prev, newBalance]);
 *       console.log('Balance changed:', newBalance);
 *     },
 *     { refreshInterval: 5000 }
 *   );
 *
 *   return <div>Balance changes: {history.length}</div>;
 * }
 * ```
 */
export function useArcBalanceWatcher(
  address?: string,
  onChange?: (balance: bigint) => void,
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { balance, loading, error } = useArcUSDCBalance(address, options);

  useEffect(() => {
    if (balance !== null && onChange) {
      onChange(balance);
    }
  }, [balance, onChange]);

  return { balance, loading, error };
}

/**
 * Hook to get balance with threshold alerts
 * Useful for warning users about low balances
 *
 * @param address - User address
 * @param thresholds - Warning and critical thresholds
 * @returns Balance info with alert level
 *
 * @example
 * ```tsx
 * function BalanceAlert({ address }: { address: string }) {
 *   const { balance, alertLevel, formatted } = useArcBalanceWithAlerts(
 *     address,
 *     {
 *       warning: parseUSDCAmount('10'),  // 10 USDC
 *       critical: parseUSDCAmount('1'),  // 1 USDC
 *     }
 *   );
 *
 *   return (
 *     <div className={
 *       alertLevel === 'critical' ? 'text-red-600' :
 *       alertLevel === 'warning' ? 'text-yellow-600' :
 *       'text-green-600'
 *     }>
 *       Balance: {formatted} USDC
 *       {alertLevel === 'critical' && ' ⚠️ Low Balance!'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcBalanceWithAlerts(
  address?: string,
  thresholds: {
    warning: bigint;
    critical: bigint;
  } = {
    warning: 10_000000n, // 10 USDC
    critical: 1_000000n, // 1 USDC
  }
) {
  const { balance, formatted, loading, error } = useArcUSDCBalance(address);

  const alertLevel: 'ok' | 'warning' | 'critical' =
    balance === null
      ? 'ok'
      : balance <= thresholds.critical
      ? 'critical'
      : balance <= thresholds.warning
      ? 'warning'
      : 'ok';

  return {
    balance,
    formatted,
    alertLevel,
    loading,
    error,
  };
}
