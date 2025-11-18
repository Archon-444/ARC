/**
 * Circle Wallets SDK Configuration
 *
 * Configures Circle User-Controlled Wallets for Arc blockchain
 */

import { initializationService, W3SSdk } from '@circle-fin/user-controlled-wallets';

// Circle SDK App ID (should be set in environment variables)
export const CIRCLE_APP_ID = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '';

/**
 * Initialize Circle SDK
 * Should be called once on app startup
 */
export function initializeCircleSDK(): W3SSdk | null {
  if (!CIRCLE_APP_ID) {
    console.warn('Circle App ID not configured. Set NEXT_PUBLIC_CIRCLE_APP_ID in .env');
    return null;
  }

  try {
    const sdk = initializationService({ appId: CIRCLE_APP_ID });
    return sdk;
  } catch (error) {
    console.error('Failed to initialize Circle SDK:', error);
    return null;
  }
}

/**
 * Circle Wallet Types
 */
export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  state: 'LIVE' | 'FROZEN';
  createDate: string;
  updateDate: string;
}

export interface CircleUser {
  userId: string;
  email?: string;
  wallets: CircleWallet[];
}

export interface CircleChallenge {
  challengeId: string;
  type: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
}

/**
 * Blockchain configuration for Arc
 */
export const ARC_BLOCKCHAIN_CONFIG = {
  blockchain: 'ARC',
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.network',
} as const;

/**
 * Circle Wallet Errors
 */
export class CircleWalletError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CircleWalletError';
  }
}

/**
 * Validate Circle wallet address
 */
export function isValidCircleAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format Circle wallet for display
 */
export function formatCircleWallet(wallet: CircleWallet): string {
  return `${wallet.blockchain}:${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
}
