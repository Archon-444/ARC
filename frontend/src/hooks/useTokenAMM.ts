import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, parseEther, formatUnits, formatEther } from 'viem';
import { useCallback } from 'react';
import ArcBondingCurveAMMABI from './abis/ArcBondingCurveAMM.json';
import ERC20ABI from './abis/ERC20.json';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

/**
 * Hook for buying tokens on a bonding curve AMM
 */
export function useBuyTokens(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyTokens = useCallback(
    (usdcAmount: string, minTokensOut: bigint = 0n) => {
      if (!ammAddress) return;
      writeContract({
        address: ammAddress as `0x${string}`,
        abi: ArcBondingCurveAMMABI,
        functionName: 'buyTokens',
        args: [parseUnits(usdcAmount, 6), minTokensOut],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    buyTokens,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for approving USDC for AMM buys
 */
export function useApproveAMMUSDC(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback(
    (amountInUSDC: string) => {
      if (!ammAddress) return;
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [ammAddress as `0x${string}`, parseUnits(amountInUSDC, 6)],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    approve,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for selling tokens on a bonding curve AMM
 */
export function useSellTokens(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const sellTokens = useCallback(
    (tokenAmount: string, minUsdcOut: bigint = 0n) => {
      if (!ammAddress) return;
      writeContract({
        address: ammAddress as `0x${string}`,
        abi: ArcBondingCurveAMMABI,
        functionName: 'sellTokens',
        args: [parseEther(tokenAmount), minUsdcOut],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    sellTokens,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for reading current price from AMM
 */
export function useCurrentPrice(ammAddress: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'getCurrentPrice',
    query: { enabled: !!ammAddress },
  });

  return {
    price: data as bigint | undefined,
    priceFormatted: data ? formatUnits(data as bigint, 6) : '0',
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading graduation status
 */
export function useIsGraduated(ammAddress: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'isGraduated',
    query: { enabled: !!ammAddress },
  });

  return {
    isGraduated: (data as boolean) || false,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading graduation progress (0-10000 bps)
 */
export function useGraduationProgress(ammAddress: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'getGraduationProgress',
    query: { enabled: !!ammAddress },
  });

  return {
    progressBps: data ? Number(data) : 0,
    progressPercent: data ? Number(data) / 100 : 0,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading AMM stats (supply, volume, reserve)
 */
export function useAMMStats(ammAddress: string) {
  const addr = ammAddress as `0x${string}`;
  const enabled = !!ammAddress;

  const { data: supply } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'currentSupply', query: { enabled },
  });
  const { data: volume } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'totalVolume', query: { enabled },
  });
  const { data: reserve } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'getReserveBalance', query: { enabled },
  });
  const { data: available } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'getAvailableTokens', query: { enabled },
  });

  return {
    currentSupply: supply as bigint | undefined,
    currentSupplyFormatted: supply ? formatEther(supply as bigint) : '0',
    totalVolume: volume as bigint | undefined,
    totalVolumeFormatted: volume ? formatUnits(volume as bigint, 6) : '0',
    reserveBalance: reserve as bigint | undefined,
    reserveFormatted: reserve ? formatUnits(reserve as bigint, 6) : '0',
    availableTokens: available as bigint | undefined,
    availableFormatted: available ? formatEther(available as bigint) : '0',
  };
}

/**
 * Hook for calculating buy return (view function)
 */
export function useCalculateBuyReturn(ammAddress: string, usdcAmount: string) {
  const parsedAmount = usdcAmount && parseFloat(usdcAmount) > 0
    ? parseUnits(usdcAmount, 6)
    : undefined;

  const { data, isLoading } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'calculateBuyReturn',
    args: parsedAmount ? [parsedAmount] : undefined,
    query: { enabled: !!ammAddress && !!parsedAmount },
  });

  const result = data as [bigint, bigint] | undefined;

  return {
    tokensOut: result?.[0],
    tokensOutFormatted: result?.[0] ? formatEther(result[0]) : '0',
    fee: result?.[1],
    feeFormatted: result?.[1] ? formatUnits(result[1], 6) : '0',
    isLoading,
  };
}

/**
 * Hook for calculating sell return (view function)
 */
export function useCalculateSellReturn(ammAddress: string, tokenAmount: string) {
  const parsedAmount = tokenAmount && parseFloat(tokenAmount) > 0
    ? parseEther(tokenAmount)
    : undefined;

  const { data, isLoading } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'calculateSellReturn',
    args: parsedAmount ? [parsedAmount] : undefined,
    query: { enabled: !!ammAddress && !!parsedAmount },
  });

  const result = data as [bigint, bigint] | undefined;

  return {
    usdcOut: result?.[0],
    usdcOutFormatted: result?.[0] ? formatUnits(result[0], 6) : '0',
    fee: result?.[1],
    feeFormatted: result?.[1] ? formatUnits(result[1], 6) : '0',
    isLoading,
  };
}
