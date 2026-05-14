/**
 * React Hook for Arc Network Statistics
 * Monitors Arc blockchain network health and statistics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getArcNetworkStats,
  getArcNetworkHealth,
  ArcNetworkStats,
} from '@/lib/arc-utils';

interface NetworkHealth {
  isHealthy: boolean;
  latency: number;
  blockHeight: number;
  message: string;
}

/**
 * Hook to get Arc network statistics with automatic refresh
 *
 * @param options - Configuration options
 * @returns Network stats, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function NetworkStats() {
 *   const { stats, loading, health } = useArcNetworkStats({
 *     refreshInterval: 10000,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!stats) return null;
 *
 *   return (
 *     <div>
 *       <p>Latest Block: {stats.latestBlock}</p>
 *       <p>Block Time: {stats.blockTime}s</p>
 *       <p>Chain ID: {stats.chainId}</p>
 *       <p>Status: {health?.isHealthy ? '🟢 Healthy' : '🔴 Issues'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcNetworkStats(
  options: {
    enabled?: boolean;
    refreshInterval?: number;
    includeHealth?: boolean;
  } = {}
) {
  const {
    enabled = true,
    refreshInterval = 30000, // 30 seconds
    includeHealth = true,
  } = options;

  const [stats, setStats] = useState<ArcNetworkStats | null>(null);
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!enabled) return;

    try {
      const [networkStats, networkHealth] = await Promise.all([
        getArcNetworkStats(),
        includeHealth ? getArcNetworkHealth() : Promise.resolve(null),
      ]);

      setStats(networkStats);
      if (networkHealth) setHealth(networkHealth);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, includeHealth]);

  useEffect(() => {
    fetchStats();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    health,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook to get only network health status
 * Lighter weight than full stats, good for status indicators
 *
 * @param options - Configuration options
 * @returns Network health, loading state, and error
 *
 * @example
 * ```tsx
 * function NetworkStatusIndicator() {
 *   const { health, loading } = useArcNetworkHealth({
 *     refreshInterval: 15000,
 *   });
 *
 *   if (loading) return <div>Checking...</div>;
 *
 *   return (
 *     <div className={health?.isHealthy ? 'text-green-600' : 'text-red-600'}>
 *       {health?.isHealthy ? '🟢' : '🔴'} {health?.message}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcNetworkHealth(
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, refreshInterval = 15000 } = options;

  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkHealth = useCallback(async () => {
    if (!enabled) return;

    try {
      const networkHealth = await getArcNetworkHealth();
      setHealth(networkHealth);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    checkHealth();

    if (refreshInterval > 0) {
      const interval = setInterval(checkHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, refreshInterval]);

  return {
    health,
    loading,
    error,
    refetch: checkHealth,
  };
}

/**
 * Hook to get current block number with auto-refresh
 * Useful for displaying live block height
 *
 * @param options - Configuration options
 * @returns Current block number, loading state, and error
 *
 * @example
 * ```tsx
 * function BlockNumber() {
 *   const { blockNumber, loading } = useArcBlockNumber({
 *     refreshInterval: 500, // Update every 500ms for Arc's fast blocks
 *   });
 *
 *   return (
 *     <div>
 *       Block: #{loading ? '...' : blockNumber}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcBlockNumber(
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, refreshInterval = 1000 } = options;

  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchBlockNumber = async () => {
      try {
        const stats = await getArcNetworkStats();
        setBlockNumber(stats.latestBlock);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockNumber();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchBlockNumber, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, refreshInterval]);

  return {
    blockNumber,
    loading,
    error,
  };
}

/**
 * Hook to calculate time until a specific block
 * Useful for auction end times, governance voting periods
 *
 * @param targetBlock - Target block number
 * @param options - Configuration options
 * @returns Time remaining info, loading state, and error
 *
 * @example
 * ```tsx
 * function AuctionTimer({ endBlock }: { endBlock: number }) {
 *   const { timeRemaining, loading } = useArcTimeUntilBlock(endBlock, {
 *     refreshInterval: 1000,
 *   });
 *
 *   if (loading) return <div>Calculating...</div>;
 *   if (!timeRemaining) return null;
 *
 *   return (
 *     <div>
 *       Time remaining: {timeRemaining.formatted}
 *       ({timeRemaining.blocks} blocks)
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcTimeUntilBlock(
  targetBlock: number,
  options: {
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, refreshInterval = 1000 } = options;

  const [timeRemaining, setTimeRemaining] = useState<{
    blocks: number;
    seconds: number;
    formatted: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const calculateTime = async () => {
      try {
        const stats = await getArcNetworkStats();
        const blocksRemaining = Math.max(0, targetBlock - stats.latestBlock);

        // Arc block time is ~0.5 seconds
        const secondsRemaining = blocksRemaining * 0.5;

        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = Math.floor(secondsRemaining % 60);

        let formatted = '';
        if (hours > 0) formatted += `${hours}h `;
        if (minutes > 0) formatted += `${minutes}m `;
        formatted += `${seconds}s`;

        setTimeRemaining({
          blocks: blocksRemaining,
          seconds: secondsRemaining,
          formatted: formatted.trim(),
        });
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    calculateTime();

    if (refreshInterval > 0) {
      const interval = setInterval(calculateTime, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [targetBlock, enabled, refreshInterval]);

  return {
    timeRemaining,
    loading,
    error,
    isExpired: timeRemaining?.blocks === 0,
  };
}
