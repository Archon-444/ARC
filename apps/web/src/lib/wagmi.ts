import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'viem';

/**
 * Arc Testnet Chain Configuration
 *
 * IMPORTANT: Arc blockchain uses USDC as the native gas token (NOT ETH!)
 * - Chain ID: 5042002
 * - Native Currency: USDC (6 decimals, not 18!)
 * - Finality: 100-350ms (deterministic)
 * - TPS: 3,000-10,000
 */
export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6, // CRITICAL: USDC has 6 decimals, NOT 18!
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.arc.network'],
      webSocket: [process.env.NEXT_PUBLIC_WS_URL || 'wss://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
  contracts: {
    // Add multicall3 if available on Arc
    // multicall3: {
    //   address: '0x...',
    //   blockCreated: 0,
    // },
  },
};

/**
 * Arc Mainnet Chain Configuration
 *
 * PLACEHOLDER: Arc Mainnet chain ID not yet announced by Circle
 * Update this when Circle launches mainnet
 */
export const arcMainnet: Chain = {
  id: 999999, // Placeholder - will be announced by Circle
  name: 'Arc',
  nativeCurrency: {
    decimals: 6, // USDC has 6 decimals
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || 'https://rpc.arc.network'],
    },
    public: {
      http: ['https://rpc.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://arcscan.app',
    },
  },
  testnet: false,
};

// Wagmi configuration for ArcMarket
export const config = getDefaultConfig({
  appName: 'ArcMarket',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [arcTestnet],
  ssr: true,
});

// Export chain configurations for use in other files
export const supportedChains = [arcTestnet] as const;
export const defaultChain = arcTestnet;
