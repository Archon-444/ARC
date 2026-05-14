/**
 * React Hook for Arc Gas Estimation
 * Provides USDC-based gas calculations for Arc transactions
 */

import { useState, useEffect, useCallback } from 'react';
import { calculateArcGas, ArcGasEstimate } from '@/lib/arc-utils';

/**
 * Hook to estimate gas for a transaction
 * Arc uses USDC for gas, so estimates are in USDC
 *
 * @param transactionData - Transaction data to estimate
 * @param options - Configuration options
 * @returns Gas estimate, loading state, error, and recalculate function
 *
 * @example
 * ```tsx
 * function BuyButton({ collectionAddress, tokenId, price }) {
 *   const { address } = useAccount();
 *   const { gasEstimate, loading } = useArcGasEstimate({
 *     from: address,
 *     to: collectionAddress,
 *     value: '0x0',
 *     data: encodeFunctionData({
 *       abi: marketplaceABI,
 *       functionName: 'buyItem',
 *       args: [collectionAddress, tokenId]
 *     })
 *   });
 *
 *   return (
 *     <div>
 *       <p>Price: {formatUSDC(price)} USDC</p>
 *       {gasEstimate && (
 *         <p>Est. Gas: {gasEstimate.gasCostFormatted}</p>
 *       )}
 *       <button disabled={loading}>Buy NFT</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcGasEstimate(
  transactionData?: any,
  options: {
    enabled?: boolean;
    autoUpdate?: boolean;
  } = {}
) {
  const { enabled = true, autoUpdate = false } = options;

  const [gasEstimate, setGasEstimate] = useState<ArcGasEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const estimate = useCallback(async () => {
    if (!transactionData || !enabled) {
      setGasEstimate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await calculateArcGas(transactionData);
      setGasEstimate(result);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to estimate gas:', err);
    } finally {
      setLoading(false);
    }
  }, [transactionData, enabled]);

  useEffect(() => {
    if (autoUpdate) {
      estimate();
    }
  }, [estimate, autoUpdate]);

  return {
    gasEstimate,
    loading,
    error,
    estimate, // Manual trigger
  };
}

/**
 * Hook to compare gas costs across multiple transactions
 * Useful for showing users the most cost-effective option
 *
 * @param transactions - Array of transactions to compare
 * @returns Array of gas estimates, loading state, and cheapest option
 *
 * @example
 * ```tsx
 * function TransactionOptions() {
 *   const { estimates, cheapest, loading } = useArcGasComparison([
 *     { name: 'Direct Buy', data: buyTxData },
 *     { name: 'Buy with Approval', data: buyWithApprovalTxData },
 *   ]);
 *
 *   return (
 *     <div>
 *       {estimates.map((est, i) => (
 *         <div key={i}>
 *           {transactions[i].name}: {est?.gasCostFormatted}
 *           {cheapest === i && ' ✨ Cheapest'}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcGasComparison(
  transactions: Array<{ name: string; data: any }>
) {
  const [estimates, setEstimates] = useState<(ArcGasEstimate | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (transactions.length === 0) {
      setEstimates([]);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      transactions.map((tx) =>
        calculateArcGas(tx.data).catch((err) => {
          console.error(`Failed to estimate gas for ${tx.name}:`, err);
          return null;
        })
      )
    )
      .then(setEstimates)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(transactions)]);

  // Find cheapest option
  const cheapest = estimates.reduce(
    (minIndex, est, index) => {
      if (!est) return minIndex;
      if (minIndex === -1) return index;

      const minEst = estimates[minIndex];
      if (!minEst) return index;

      return est.gasInUSDC < minEst.gasInUSDC ? index : minIndex;
    },
    -1
  );

  return {
    estimates,
    cheapest,
    loading,
    error,
  };
}

/**
 * Hook to calculate total transaction cost (price + gas)
 * Useful for showing users the complete cost of a purchase
 *
 * @param price - Item price in USDC (bigint, 6 decimals)
 * @param transactionData - Transaction data for gas estimate
 * @returns Total cost info, loading state, and error
 *
 * @example
 * ```tsx
 * function PurchaseSummary({ nftPrice, txData }) {
 *   const { totalCost, breakdown, loading } = useArcTotalCost(
 *     nftPrice,
 *     txData
 *   );
 *
 *   if (loading) return <div>Calculating...</div>;
 *
 *   return (
 *     <div>
 *       <p>NFT Price: {breakdown.priceFormatted}</p>
 *       <p>Gas Fee: {breakdown.gasFormatted}</p>
 *       <p className="font-bold">
 *         Total: {breakdown.totalFormatted} USDC
 *       </p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcTotalCost(
  price: bigint,
  transactionData?: any
) {
  const { gasEstimate, loading, error } = useArcGasEstimate(transactionData, {
    autoUpdate: true,
  });

  // Convert price from wei (6 decimals) to USDC
  const priceInUSDC = Number(price) / 1e6;

  // Total cost in USDC
  const totalCostUSDC = priceInUSDC + (gasEstimate?.gasInUSDC || 0);

  // Format for display
  const formatUSDC = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });

  const breakdown = {
    price: priceInUSDC,
    priceFormatted: formatUSDC(priceInUSDC),
    gas: gasEstimate?.gasInUSDC || 0,
    gasFormatted: gasEstimate?.gasCostFormatted || '0.00',
    total: totalCostUSDC,
    totalFormatted: formatUSDC(totalCostUSDC),
  };

  return {
    totalCost: totalCostUSDC,
    breakdown,
    loading,
    error,
  };
}

/**
 * Hook to track gas price trends
 * Useful for showing users when gas is cheap
 *
 * @param options - Configuration options
 * @returns Current gas price, trend info, loading state
 *
 * @example
 * ```tsx
 * function GasPriceIndicator() {
 *   const { currentPrice, trend, isLow } = useArcGasPriceTrend({
 *     sampleInterval: 60000, // Sample every minute
 *   });
 *
 *   return (
 *     <div className={isLow ? 'text-green-600' : 'text-gray-600'}>
 *       Gas: {currentPrice}
 *       {isLow && ' 🟢 Low gas!'}
 *       {trend === 'up' && ' ↗️'}
 *       {trend === 'down' && ' ↘️'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcGasPriceTrend(
  options: {
    enabled?: boolean;
    sampleInterval?: number;
    historySize?: number;
  } = {}
) {
  const {
    enabled = true,
    sampleInterval = 60000, // 1 minute
    historySize = 10,
  } = options;

  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sampleGasPrice = async () => {
      try {
        // Sample with a simple transaction
        const estimate = await calculateArcGas({
          from: '0x0000000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000001',
          value: '0x0',
          data: '0x',
        });

        setPriceHistory((prev) => {
          const newHistory = [...prev, estimate.gasInUSDC];
          return newHistory.slice(-historySize);
        });
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    sampleGasPrice();

    const interval = setInterval(sampleGasPrice, sampleInterval);
    return () => clearInterval(interval);
  }, [enabled, sampleInterval, historySize]);

  // Calculate trend
  const currentPrice = priceHistory[priceHistory.length - 1] || 0;
  const previousPrice = priceHistory[priceHistory.length - 2] || currentPrice;

  const trend: 'up' | 'down' | 'stable' =
    currentPrice > previousPrice * 1.1
      ? 'up'
      : currentPrice < previousPrice * 0.9
      ? 'down'
      : 'stable';

  // Calculate average
  const averagePrice =
    priceHistory.length > 0
      ? priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length
      : 0;

  // Consider gas "low" if current is below average
  const isLow = currentPrice < averagePrice * 0.9;
  const isHigh = currentPrice > averagePrice * 1.1;

  return {
    currentPrice,
    averagePrice,
    trend,
    isLow,
    isHigh,
    priceHistory,
    loading,
    error,
  };
}

/**
 * Hook to estimate gas with buffer for safety
 * Adds a safety margin to gas estimates to prevent out-of-gas errors
 *
 * @param transactionData - Transaction data
 * @param bufferPercent - Safety buffer percentage (default 20%)
 * @returns Buffered gas estimate
 *
 * @example
 * ```tsx
 * function SafeTransaction({ txData }) {
 *   const { gasEstimate, loading } = useArcGasWithBuffer(txData, 20);
 *
 *   return (
 *     <div>
 *       Estimated cost: {gasEstimate?.gasCostFormatted}
 *       <small>(includes 20% safety buffer)</small>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArcGasWithBuffer(
  transactionData?: any,
  bufferPercent: number = 20
) {
  const { gasEstimate, loading, error } = useArcGasEstimate(transactionData, {
    autoUpdate: true,
  });

  const bufferedEstimate: ArcGasEstimate | null = gasEstimate
    ? {
        ...gasEstimate,
        gasLimit: Math.ceil(gasEstimate.gasLimit * (1 + bufferPercent / 100)),
        gasInUSDC: gasEstimate.gasInUSDC * (1 + bufferPercent / 100),
        gasCostFormatted: `${(gasEstimate.gasInUSDC * (1 + bufferPercent / 100)).toFixed(6)} USDC`,
        totalCostUSDC: (gasEstimate.gasInUSDC * (1 + bufferPercent / 100)).toFixed(6),
      }
    : null;

  return {
    gasEstimate: bufferedEstimate,
    originalEstimate: gasEstimate,
    bufferPercent,
    loading,
    error,
  };
}
