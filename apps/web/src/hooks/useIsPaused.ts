import { useReadContract } from 'wagmi';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;

const pausedAbi = [
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Hook to check if the ArcMarketplace contract is paused.
 * Returns { isPaused, isLoading, isError } so UI components can
 * disable Buy / List / Bid buttons and show a banner when paused.
 */
export function useIsPaused() {
  const { data, isLoading, isError } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: pausedAbi,
    functionName: 'paused',
    query: {
      // Re-fetch every 15 seconds so the UI reacts promptly to pause/unpause
      refetchInterval: 15_000,
    },
  });

  return {
    isPaused: (data as boolean) ?? false,
    isLoading,
    isError,
  };
}
