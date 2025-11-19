/**
 * Circle Bridge Kit Configuration
 *
 * Enables cross-chain USDC transfers using Circle's CCTP (Cross-Chain Transfer Protocol)
 * Supports 34 chains with 544 bridge routes
 */

import { BridgeKit } from '@circle-fin/bridge-kit';

// Supported chains for bridging to/from Arc
export const SUPPORTED_BRIDGE_CHAINS = [
  'Ethereum',
  'Base',
  'Arbitrum',
  'Polygon',
  'Avalanche',
  'Optimism',
  'Solana',
] as const;

export type SupportedBridgeChain = typeof SUPPORTED_BRIDGE_CHAINS[number];

/**
 * Bridge speed options
 * - FAST: Higher fees, faster completion
 * - SLOW: Lower fees, slower completion
 */
export type BridgeSpeed = 'FAST' | 'SLOW';

/**
 * Bridge result state
 */
export interface BridgeResult {
  state: 'success' | 'error' | 'partial';
  transactionHash?: string;
  steps?: Array<{
    step: string;
    state: 'success' | 'error' | 'pending';
    error?: Error;
  }>;
  error?: Error;
}

/**
 * Bridge estimation
 */
export interface BridgeEstimate {
  fees: string;
  gasFees: string;
  totalCost: string;
  estimatedTime: string;
}

/**
 * Initialize Bridge Kit
 */
export function initializeBridgeKit(): BridgeKit {
  return new BridgeKit();
}

/**
 * Circle Bridge Errors
 */
export class CircleBridgeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CircleBridgeError';
  }
}
