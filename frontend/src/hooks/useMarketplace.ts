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
  nftContract: string;
  tokenId: bigint;
  price: bigint;
  active: boolean;
}

export interface Auction {
  seller: string;
  nftContract: string;
  tokenId: bigint;
  startingPrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  endTime: bigint;
  active: boolean;
}

/**
 * Hook for listing NFTs on the marketplace (ArcMarketplace.createListing)
 */
export function useListItem() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const listItem = useCallback(
    (nftContract: string, tokenId: string, priceInUSDC: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'createListing',
        args: [
          nftContract as `0x${string}`,
          BigInt(tokenId),
          parseUnits(priceInUSDC, 6),
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
 * Hook for buying NFTs (ArcMarketplace.buyListing)
 */
export function useBuyItem() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyItem = useCallback(
    (listingId: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'buyListing',
        args: [
          BigInt(listingId),
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
 * Hook for canceling listings (ArcMarketplace.cancelListing)
 */
export function useCancelListing() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelListing = useCallback(
    (listingId: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'cancelListing',
        args: [
          BigInt(listingId),
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
 * Hook for creating auctions (ArcMarketplace.createAuction)
 */
export function useCreateAuction() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAuction = useCallback(
    (
      nftContract: string,
      tokenId: string,
      startingPrice: string,
      durationSeconds: number
    ) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'createAuction',
        args: [
          nftContract as `0x${string}`,
          BigInt(tokenId),
          parseUnits(startingPrice, 6),
          BigInt(durationSeconds),
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
 * Hook for placing bids on auctions (ArcMarketplace.placeBid)
 */
export function usePlaceBid() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBid = useCallback(
    (auctionId: string, bidAmount: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'placeBid',
        args: [
          BigInt(auctionId),
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
 * Hook for ending auctions (ArcMarketplace.endAuction)
 */
export function useEndAuction() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const endAuction = useCallback(
    (auctionId: string) => {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: NFTMarketplaceABI,
        functionName: 'endAuction',
        args: [
          BigInt(auctionId),
        ],
      });
    },
    [writeContract]
  );

  return {
    endAuction,
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
 * Hook for reading listing data by ID
 */
export function useListing(listingId: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'listings',
    args: listingId ? [BigInt(listingId)] : undefined,
    query: {
      enabled: !!listingId,
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
 * Hook for reading auction data by ID
 */
export function useAuction(auctionId: string) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'auctions',
    args: auctionId ? [BigInt(auctionId)] : undefined,
    query: {
      enabled: !!auctionId,
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
 * Hook for reading platform fee
 */
export function usePlatformFee() {
  const { data, isError, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'platformFee',
  });

  return {
    platformFeeBps: data as number | undefined,
    platformFeePercent: data ? Number(data) / 100 : undefined,
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
