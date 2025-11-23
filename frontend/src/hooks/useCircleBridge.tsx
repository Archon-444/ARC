/**
 * Circle Bridge Hook
 *
 * React hook for cross-chain USDC bridging using Circle's Bridge Kit
 * Enables users to bridge USDC from other chains to Arc blockchain
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import type { SupportedBridgeChain, BridgeSpeed, BridgeResult, BridgeEstimate } from '@/lib/circle-bridge';
import { initializeBridgeKit, CircleBridgeError } from '@/lib/circle-bridge';

interface BridgeParams {
  fromChain: SupportedBridgeChain;
  toChain: SupportedBridgeChain;
  amount: string;
  speed?: BridgeSpeed;
  recipientAddress?: string;
}

interface UseBridgeReturn {
  // State
  isLoading: boolean;
  error: Error | null;
  result: BridgeResult | null;
  estimate: BridgeEstimate | null;

  // Methods
  bridge: (params: BridgeParams) => Promise<BridgeResult>;
  estimateBridge: (params: BridgeParams) => Promise<BridgeEstimate>;
  retryBridge: (failedResult: BridgeResult) => Promise<BridgeResult>;
  checkRouteSupport: (fromChain: SupportedBridgeChain, toChain: SupportedBridgeChain) => Promise<boolean>;
}

/**
 * Hook for Circle Bridge operations
 *
 * @example
 * ```tsx
 * function BridgeComponent() {
 *   const { bridge, estimateBridge, isLoading } = useCircleBridge();
 *
 *   const handleBridge = async () => {
 *     // Get estimate first
 *     const estimate = await estimateBridge({
 *       fromChain: 'Ethereum',
 *       toChain: 'Base',
 *       amount: '100.00',
 *     });
 *     console.log('Fees:', estimate.fees);
 *
 *     // Execute bridge
 *     const result = await bridge({
 *       fromChain: 'Ethereum',
 *       toChain: 'Base',
 *       amount: '100.00',
 *       speed: 'FAST',
 *     });
 *
 *     if (result.state === 'success') {
 *       console.log('Bridge successful!');
 *     }
 *   };
 *
 *   return <button onClick={handleBridge}>Bridge USDC</button>;
 * }
 * ```
 */
export function useCircleBridge(): UseBridgeReturn {
  const [kit, setKit] = useState<BridgeKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);

  // Initialize Bridge Kit
  useEffect(() => {
    try {
      const bridgeKit = initializeBridgeKit();
      setKit(bridgeKit);
      console.log('✅ Circle Bridge Kit initialized');
    } catch (err) {
      console.error('Failed to initialize Bridge Kit:', err);
      setError(err as Error);
    }
  }, []);

  /**
   * Execute a cross-chain bridge operation
   */
  const bridge = useCallback(
    async (params: BridgeParams): Promise<BridgeResult> => {
      if (!kit) {
        throw new CircleBridgeError('Bridge Kit not initialized');
      }

      // Check if wallet is connected
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new CircleBridgeError('No wallet provider found. Please install MetaMask or another wallet.');
      }

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        // Create adapter from browser wallet provider
        const adapter = await createAdapterFromProvider({
          provider: window.ethereum,
        });

        // Build bridge configuration
        const bridgeConfig: any = {
          from: {
            adapter,
            chain: params.fromChain,
          },
          to: params.recipientAddress
            ? {
              adapter,
              chain: params.toChain,
              recipientAddress: params.recipientAddress,
            }
            : {
              adapter,
              chain: params.toChain,
            },
          amount: params.amount,
          token: 'USDC',
        };

        // Add speed configuration if specified
        if (params.speed) {
          bridgeConfig.config = {
            transferSpeed: params.speed,
          };
        }

        // Execute bridge operation
        const bridgeResult = await kit.bridge(bridgeConfig);

        const result: BridgeResult = {
          state: bridgeResult.state as 'success' | 'error' | 'partial',
          transactionHash: (bridgeResult as any).transactionHash,
          steps: (bridgeResult as any).steps,
          error: bridgeResult.state === 'error' ? new Error('Bridge operation failed') : undefined,
        };

        setResult(result);

        if (result.state === 'success') {
          console.log('✅ Bridge successful!');
        } else {
          console.error('❌ Bridge failed:', result.error);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        console.error('Bridge error:', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [kit]
  );

  /**
   * Get cost estimate for a bridge operation
   */
  const estimateBridge = useCallback(
    async (params: BridgeParams): Promise<BridgeEstimate> => {
      if (!kit) {
        throw new CircleBridgeError('Bridge Kit not initialized');
      }

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new CircleBridgeError('No wallet provider found');
      }

      setIsLoading(true);
      setError(null);

      try {
        const adapter = await createAdapterFromProvider({
          provider: window.ethereum,
        });

        const estimateResult = await kit.estimate({
          from: {
            adapter,
            chain: params.fromChain,
          },
          to: {
            adapter,
            chain: params.toChain,
          },
          amount: params.amount,
          token: 'USDC',
        });

        const estimate: BridgeEstimate = {
          fees: (estimateResult as any).fees || '0',
          gasFees: (estimateResult as any).gasFees || '0',
          totalCost: (estimateResult as any).totalCost || params.amount,
          estimatedTime: params.speed === 'FAST' ? '~15 minutes' : '~30 minutes',
        };

        setEstimate(estimate);
        return estimate;
      } catch (err) {
        const error = err as Error;
        console.error('Estimate error:', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [kit]
  );

  /**
   * Retry a failed bridge operation
   */
  const retryBridge = useCallback(
    async (failedResult: BridgeResult): Promise<BridgeResult> => {
      if (!kit) {
        throw new CircleBridgeError('Bridge Kit not initialized');
      }

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new CircleBridgeError('No wallet provider found');
      }

      setIsLoading(true);
      setError(null);

      try {
        const adapter = await createAdapterFromProvider({
          provider: window.ethereum,
        });

        const retryResult = await kit.retry(failedResult as any, {
          from: adapter,
          to: adapter,
        });

        const result: BridgeResult = {
          state: retryResult.state as 'success' | 'error' | 'partial',
          transactionHash: (retryResult as any).transactionHash,
          steps: (retryResult as any).steps,
        };

        setResult(result);
        return result;
      } catch (err) {
        const error = err as Error;
        console.error('Retry error:', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [kit]
  );

  /**
   * Check if a bridge route is supported
   */
  const checkRouteSupport = useCallback(
    async (fromChain: SupportedBridgeChain, toChain: SupportedBridgeChain): Promise<boolean> => {
      if (!kit) {
        return false;
      }

      try {
        return await (kit as any).supportsRoute(fromChain, toChain, 'USDC');
      } catch (err) {
        console.error('Route check error:', err);
        return false;
      }
    },
    [kit]
  );

  return {
    isLoading,
    error,
    result,
    estimate,
    bridge,
    estimateBridge,
    retryBridge,
    checkRouteSupport,
  };
}
