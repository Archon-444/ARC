import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'viem';

// Arc Testnet Configuration
export const arcTestnet: Chain = {
  id: 1234, // Replace with actual Arc testnet chain ID
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || 'https://rpc.arc.testnet.circle.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || 'https://rpc.arc.testnet.circle.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://explorer.arc.testnet.circle.com',
    },
  },
  testnet: true,
};

// Arc Mainnet Configuration
export const arcMainnet: Chain = {
  id: 5678, // Replace with actual Arc mainnet chain ID
  name: 'Arc',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || 'https://rpc.arc.circle.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || 'https://rpc.arc.circle.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://explorer.arc.circle.com',
    },
  },
  testnet: false,
};

export const config = getDefaultConfig({
  appName: 'ArcMarket',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [arcTestnet, arcMainnet],
  ssr: true,
});
