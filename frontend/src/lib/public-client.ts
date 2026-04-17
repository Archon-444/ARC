import { createPublicClient, http } from 'viem';
import { arcTestnet } from './wagmi';

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});
