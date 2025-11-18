/**
 * Circle Wallets Web SDK Configuration
 *
 * Configures Circle User-Controlled Wallets Web SDK for browser
 * This SDK handles PIN/biometric challenges and wallet operations in the browser
 */

import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';

// Circle SDK App ID (public, frontend)
// Get this from https://console.circle.com/
export const CIRCLE_APP_ID = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '';

/**
 * Initialize Circle Web SDK
 * Should be called once on app startup
 *
 * @returns Initialized SDK instance or null if configuration is missing
 */
export function initializeCircleSDK(): W3SSdk | null {
  if (!CIRCLE_APP_ID) {
    console.warn('Circle App ID not configured. Set NEXT_PUBLIC_CIRCLE_APP_ID in .env');
    return null;
  }

  try {
    const sdk = new W3SSdk();

    // Set app settings
    sdk.setAppSettings({
      appId: CIRCLE_APP_ID,
    });

    console.log('✅ Circle Web SDK initialized');
    return sdk;
  } catch (error) {
    console.error('Failed to initialize Circle Web SDK:', error);
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
  updateDate?: string;
  name?: string;
  refId?: string;
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

export interface CircleAuthTokens {
  userToken: string;
  encryptionKey: string;
  refreshToken?: string;
  expiresIn: number;
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
 * Supported blockchains for Circle wallets
 */
export const SUPPORTED_BLOCKCHAINS = [
  'ETH', // Ethereum
  'MATIC', // Polygon
  'AVAX', // Avalanche
  'SOL', // Solana
] as const;

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
  // EVM address format
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format Circle wallet for display
 */
export function formatCircleWallet(wallet: CircleWallet): string {
  return `${wallet.blockchain}:${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get blockchain explorer URL
 */
export function getExplorerUrl(blockchain: string, address: string): string {
  const explorers: Record<string, string> = {
    ETH: `https://etherscan.io/address/${address}`,
    MATIC: `https://polygonscan.com/address/${address}`,
    AVAX: `https://snowtrace.io/address/${address}`,
    ARC: `https://testnet.arcscan.app/address/${address}`,
  };

  return explorers[blockchain] || '';
}
