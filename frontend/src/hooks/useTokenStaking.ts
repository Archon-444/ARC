import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatUnits, formatEther } from 'viem';
import { useCallback } from 'react';
import ArcBondingCurveAMMABI from './abis/ArcBondingCurveAMM.json';

/**
 * Hook for staking tokens on a graduated AMM
 */
export function useStakeTokens(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stakeTokens = useCallback(
    (tokenAmount: string) => {
      if (!ammAddress) return;
      writeContract({
        address: ammAddress as `0x${string}`,
        abi: ArcBondingCurveAMMABI,
        functionName: 'stakeTokens',
        args: [parseEther(tokenAmount)],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    stakeTokens,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for unstaking tokens
 */
export function useUnstakeTokens(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstakeTokens = useCallback(
    (tokenAmount: string) => {
      if (!ammAddress) return;
      writeContract({
        address: ammAddress as `0x${string}`,
        abi: ArcBondingCurveAMMABI,
        functionName: 'unstakeTokens',
        args: [parseEther(tokenAmount)],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    unstakeTokens,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for claiming staking rewards
 */
export function useClaimRewards(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRewards = useCallback(() => {
    if (!ammAddress) return;
    writeContract({
      address: ammAddress as `0x${string}`,
      abi: ArcBondingCurveAMMABI,
      functionName: 'claimStakingRewards',
    });
  }, [ammAddress, writeContract]);

  return {
    claimRewards,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for reading claimable rewards for a user
 */
export function useClaimableRewards(ammAddress: string, userAddress: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'getClaimableRewards',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!ammAddress && !!userAddress },
  });

  return {
    claimable: data as bigint | undefined,
    claimableFormatted: data ? formatUnits(data as bigint, 6) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading user's staked token amount
 */
export function useUserStake(ammAddress: string, userAddress: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'tokenStaked',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!ammAddress && !!userAddress },
  });

  return {
    staked: data as bigint | undefined,
    stakedFormatted: data ? formatEther(data as bigint) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading staking pool stats
 */
export function useStakingPoolStats(ammAddress: string) {
  const addr = ammAddress as `0x${string}`;
  const enabled = !!ammAddress;

  const { data: totalStaked } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'totalTokenStaked', query: { enabled },
  });
  const { data: poolRemaining } = useReadContract({
    address: addr, abi: ArcBondingCurveAMMABI,
    functionName: 'getStakingPoolRemaining', query: { enabled },
  });

  return {
    totalStaked: totalStaked as bigint | undefined,
    totalStakedFormatted: totalStaked ? formatEther(totalStaked as bigint) : '0',
    poolRemaining: poolRemaining as bigint | undefined,
    poolRemainingFormatted: poolRemaining ? formatUnits(poolRemaining as bigint, 6) : '0',
  };
}

/**
 * Hook for creator reserve withdrawal
 */
export function useWithdrawCreatorReserve(ammAddress: string) {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = useCallback(
    (usdcAmount: string, reason: string) => {
      if (!ammAddress) return;
      writeContract({
        address: ammAddress as `0x${string}`,
        abi: ArcBondingCurveAMMABI,
        functionName: 'withdrawCreatorReserve',
        args: [BigInt(Math.floor(parseFloat(usdcAmount) * 1e6)), reason],
      });
    },
    [ammAddress, writeContract]
  );

  return {
    withdraw,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
    error: writeError,
  };
}

/**
 * Hook for reading creator reserve balance
 */
export function useCreatorReserve(ammAddress: string) {
  const { data, isLoading } = useReadContract({
    address: ammAddress as `0x${string}`,
    abi: ArcBondingCurveAMMABI,
    functionName: 'getCreatorReserveBalance',
    query: { enabled: !!ammAddress },
  });

  return {
    reserve: data as bigint | undefined,
    reserveFormatted: data ? formatUnits(data as bigint, 6) : '0',
    isLoading,
  };
}
