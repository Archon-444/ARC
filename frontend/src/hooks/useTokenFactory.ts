import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, parseEther, formatUnits } from 'viem';
import { useCallback } from 'react';
import ArcTokenFactoryABI from './abis/ArcTokenFactory.json';
import ERC20ABI from './abis/ERC20.json';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

export interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: bigint;
  basePrice: bigint;
  slope: bigint;
  curveType: number;
  graduationThreshold: bigint;
  creator: string;
  createdAt: bigint;
}

/**
 * Hook for creating a new token via ArcTokenFactory
 */
export function useCreateToken() {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createToken = useCallback(
    (params: {
      name: string;
      symbol: string;
      description: string;
      imageUrl: string;
      totalSupply: string; // in whole tokens (e.g., "1000000")
      basePrice: string; // in USDC (e.g., "0.01")
      slope: string; // in whole units (e.g., "1")
      curveType: number; // 0 = LINEAR, 1 = EXPONENTIAL
    }) => {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: ArcTokenFactoryABI,
        functionName: 'createToken',
        args: [
          params.name,
          params.symbol,
          params.description,
          params.imageUrl,
          parseEther(params.totalSupply),
          parseUnits(params.basePrice, 6),
          parseEther(params.slope),
          params.curveType,
        ],
      });
    },
    [writeContract]
  );

  return {
    createToken,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for approving USDC for token creation fee
 */
export function useApproveFactoryUSDC() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback(
    (amountInUSDC: string) => {
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [FACTORY_ADDRESS, parseUnits(amountInUSDC, 6)],
      });
    },
    [writeContract]
  );

  return {
    approve,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for reading all launched tokens
 */
export function useAllTokens() {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'getAllTokens',
  });

  return {
    tokens: (data as `0x${string}`[]) || [],
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading total token count
 */
export function useTotalTokens() {
  const { data, isError, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'getTotalTokens',
  });

  return {
    total: data ? Number(data) : 0,
    isError,
    isLoading,
  };
}

/**
 * Hook for reading token config by address
 */
export function useTokenConfig(tokenAddress: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'getTokenConfig',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress },
  });

  return {
    config: data as TokenConfig | undefined,
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading AMM address for a token
 */
export function useTokenAMM(tokenAddress: string) {
  const { data, isError, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'getTokenAMM',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress },
  });

  return {
    ammAddress: data as `0x${string}` | undefined,
    isError,
    isLoading,
  };
}

/**
 * Hook for reading creation fee
 */
export function useCreationFee() {
  const { data, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'CREATION_FEE_USDC',
  });

  return {
    fee: data as bigint | undefined,
    feeFormatted: data ? formatUnits(data as bigint, 6) : '25',
    isLoading,
  };
}

/**
 * Hook for checking if factory is paused
 */
export function useFactoryPaused() {
  const { data, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ArcTokenFactoryABI,
    functionName: 'paused',
  });

  return {
    isPaused: (data as boolean) || false,
    isLoading,
  };
}
