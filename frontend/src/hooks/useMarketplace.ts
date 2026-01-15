import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useState, useCallback } from 'react';
import NFTMarketplaceABI from './abis/NFTMarketplace.json';
import FeeVaultABI from './abis/FeeVault.json';
import ProfileRegistryABI from './abis/ProfileRegistry.json';
import ERC20ABI from './abis/ERC20.json';
import ERC721ABI from './abis/ERC721.json';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
const FEE_VAULT_ADDRESS = process.env.NEXT_PUBLIC_FEE_VAULT_ADDRESS as `0x${string}`;
const PROFILE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

export interface Listing {
  seller: string;
  collection: string;
  tokenId: bigint;
  price: bigint;
  active: boolean;
}

export interface Auction {
  seller: string;
  collection: string;
  tokenId: bigint;
  reservePrice: bigint;
  startTime: bigint;
  endTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  settled: boolean;
}

/**
 * Hook for listing NFTs on the marketplace
 */
export function useListItem() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const listItem = useCallback(
    (collection: string, token: string, priceInUSDC: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'listItem',
        args: [
          collection as `0x${string}`,
          BigInt(token),
          parseUnits(priceInUSDC, 6), // USDC has 6 decimals
        ],
      });
    },
    [writeContract]
  );

  return {
    listItem,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for buying NFTs
 */
export function useBuyItem() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyItem = useCallback(
    (collection: string, token: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'buyItem',
        args: [
          collection as `0x${string}`,
          BigInt(token),
        ],
      });
    },
    [writeContract]
  );

  return {
    buyItem,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for canceling listings
 */
export function useCancelListing() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelListing = useCallback(
    (collection: string, token: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'cancelListing',
        args: [
          collection as `0x${string}`,
          BigInt(token),
        ],
      });
    },
    [writeContract]
  );

  return {
    cancelListing,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for creating auctions
 */
export function useCreateAuction() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAuction = useCallback(
    (
      collection: string,
      tokenId: string,
      reservePrice: string,
      startTime: number,
      endTime: number
    ) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'createAuction',
        args: [
          collection as `0x${string}`,
          BigInt(tokenId),
          parseUnits(reservePrice, 6),
          BigInt(startTime),
          BigInt(endTime),
        ],
      });
    },
    [writeContract]
  );

  return {
    createAuction,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for placing bids on auctions
 */
export function usePlaceBid() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBid = useCallback(
    (collection: string, tokenId: string, bidAmount: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'placeBid',
        args: [
          collection as `0x${string}`,
          BigInt(tokenId),
          parseUnits(bidAmount, 6),
        ],
      });
    },
    [writeContract]
  );

  return {
    placeBid,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for settling auctions
 */
export function useSettleAuction() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const settleAuction = useCallback(
    (collection: string, token: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'settleAuction',
        args: [
          collection as `0x${string}`,
          BigInt(token),
        ],
      });
    },
    [writeContract]
  );

  return {
    settleAuction,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for approving USDC spending
 */
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = useCallback(
    (amountInUSDC: string) => {
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, parseUnits(amountInUSDC, 6)],
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
 * Hook for approving NFT transfer
 */
export function useApproveNFT(collectionAddress: string) {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = useCallback(() => {
    if (!collectionAddress) return;
    writeContract({
      address: collectionAddress as `0x${string}`,
      abi: ERC721ABI,
      functionName: 'setApprovalForAll',
      args: [MARKETPLACE_ADDRESS, true],
    });
  }, [collectionAddress, writeContract]);

  return {
    approve,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for reading listing data
 */
export function useListing(collectionAddress: string, tokenId: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'listings',
    args: collectionAddress && tokenId ? [collectionAddress as `0x${string}`, BigInt(tokenId)] : undefined,
    query: {
      enabled: !!collectionAddress && !!tokenId,
    }
  });

  return {
    listing: data as Listing | undefined,
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading auction data
 */
export function useAuction(collectionAddress: string, tokenId: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'auctions',
    args: collectionAddress && tokenId ? [collectionAddress as `0x${string}`, BigInt(tokenId)] : undefined,
    query: {
      enabled: !!collectionAddress && !!tokenId,
    }
  });

  return {
    auction: data as Auction | undefined,
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading protocol fee
 */
export function useProtocolFee() {
  const { data, isError, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'protocolFeeBps',
  });

  return {
    protocolFeeBps: data as number | undefined,
    protocolFeePercent: data ? Number(data) / 100 : undefined,
    isError,
    isLoading,
  };
}

/**
 * Hook for checking USDC balance
 */
export function useUSDCBalance(address: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatUnits(data as bigint, 6) : '0',
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for checking USDC allowance
 */
export function useUSDCAllowance(ownerAddress: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, MARKETPLACE_ADDRESS] : undefined,
    query: {
      enabled: !!ownerAddress,
    }
  });

  return {
    allowance: data as bigint | undefined,
    allowanceFormatted: data ? formatUnits(data as bigint, 6) : '0',
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Hook for setting user profile
 */
export function useSetProfile() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setProfile = useCallback(
    (uri: string) => {
      writeContract({
        address: PROFILE_REGISTRY_ADDRESS,
        abi: ProfileRegistryABI,
        functionName: 'setProfile',
        args: [uri],
      });
    },
    [writeContract]
  );

  return {
    setProfile,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: hash,
  };
}

/**
 * Hook for reading user profile
 */
export function useProfile(address: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: ProfileRegistryABI,
    functionName: 'getProfile',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  return {
    profile: data as { metadataURI: string } | undefined,
    isError,
    isLoading,
    refetch,
  };
}

/**
 * Utility function to format USDC amounts
 */
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6);
}

/**
 * Utility function to parse USDC amounts
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6);
}
