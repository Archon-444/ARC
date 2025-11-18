import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
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
  const [collectionAddress, setCollectionAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'listItem',
    args: collectionAddress && tokenId && price ? [
      collectionAddress as `0x${string}`,
      BigInt(tokenId),
      parseUnits(price, 6), // USDC has 6 decimals
    ] : undefined,
    enabled: !!collectionAddress && !!tokenId && !!price,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const listItem = useCallback(
    (collection: string, token: string, priceInUSDC: string) => {
      setCollectionAddress(collection);
      setTokenId(token);
      setPrice(priceInUSDC);
      write?.();
    },
    [write]
  );

  return {
    listItem,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for buying NFTs
 */
export function useBuyItem() {
  const [collectionAddress, setCollectionAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'buyItem',
    args: collectionAddress && tokenId ? [
      collectionAddress as `0x${string}`,
      BigInt(tokenId),
    ] : undefined,
    enabled: !!collectionAddress && !!tokenId,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const buyItem = useCallback(
    (collection: string, token: string) => {
      setCollectionAddress(collection);
      setTokenId(token);
      write?.();
    },
    [write]
  );

  return {
    buyItem,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for canceling listings
 */
export function useCancelListing() {
  const [collectionAddress, setCollectionAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'cancelListing',
    args: collectionAddress && tokenId ? [
      collectionAddress as `0x${string}`,
      BigInt(tokenId),
    ] : undefined,
    enabled: !!collectionAddress && !!tokenId,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const cancelListing = useCallback(
    (collection: string, token: string) => {
      setCollectionAddress(collection);
      setTokenId(token);
      write?.();
    },
    [write]
  );

  return {
    cancelListing,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for creating auctions
 */
export function useCreateAuction() {
  const [params, setParams] = useState<{
    collection: string;
    tokenId: string;
    reservePrice: string;
    startTime: number;
    endTime: number;
  } | null>(null);

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'createAuction',
    args: params ? [
      params.collection as `0x${string}`,
      BigInt(params.tokenId),
      parseUnits(params.reservePrice, 6),
      params.startTime,
      params.endTime,
    ] : undefined,
    enabled: !!params,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const createAuction = useCallback(
    (
      collection: string,
      tokenId: string,
      reservePrice: string,
      startTime: number,
      endTime: number
    ) => {
      setParams({ collection, tokenId, reservePrice, startTime, endTime });
      write?.();
    },
    [write]
  );

  return {
    createAuction,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for placing bids on auctions
 */
export function usePlaceBid() {
  const [params, setParams] = useState<{
    collection: string;
    tokenId: string;
    bidAmount: string;
  } | null>(null);

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'placeBid',
    args: params ? [
      params.collection as `0x${string}`,
      BigInt(params.tokenId),
      parseUnits(params.bidAmount, 6),
    ] : undefined,
    enabled: !!params,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const placeBid = useCallback(
    (collection: string, tokenId: string, bidAmount: string) => {
      setParams({ collection, tokenId, bidAmount });
      write?.();
    },
    [write]
  );

  return {
    placeBid,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for settling auctions
 */
export function useSettleAuction() {
  const [collectionAddress, setCollectionAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'settleAuction',
    args: collectionAddress && tokenId ? [
      collectionAddress as `0x${string}`,
      BigInt(tokenId),
    ] : undefined,
    enabled: !!collectionAddress && !!tokenId,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const settleAuction = useCallback(
    (collection: string, token: string) => {
      setCollectionAddress(collection);
      setTokenId(token);
      write?.();
    },
    [write]
  );

  return {
    settleAuction,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for approving USDC spending
 */
export function useApproveUSDC() {
  const [amount, setAmount] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'approve',
    args: amount ? [MARKETPLACE_ADDRESS, parseUnits(amount, 6)] : undefined,
    enabled: !!amount,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const approve = useCallback(
    (amountInUSDC: string) => {
      setAmount(amountInUSDC);
      write?.();
    },
    [write]
  );

  return {
    approve,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for approving NFT transfer
 */
export function useApproveNFT(collectionAddress: string) {
  const { config } = usePrepareContractWrite({
    address: collectionAddress as `0x${string}`,
    abi: ERC721ABI,
    functionName: 'setApprovalForAll',
    args: [MARKETPLACE_ADDRESS, true],
    enabled: !!collectionAddress,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return {
    approve: write,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for reading listing data
 */
export function useListing(collectionAddress: string, tokenId: string) {
  const { data, isError, isLoading, refetch } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'listings',
    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
    enabled: !!collectionAddress && !!tokenId,
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
  const { data, isError, isLoading, refetch } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: NFTMarketplaceABI,
    functionName: 'auctions',
    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
    enabled: !!collectionAddress && !!tokenId,
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
  const { data, isError, isLoading } = useContractRead({
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
  const { data, isError, isLoading, refetch } = useContractRead({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address,
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
  const { data, isError, isLoading, refetch } = useContractRead({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [ownerAddress as `0x${string}`, MARKETPLACE_ADDRESS],
    enabled: !!ownerAddress,
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
  const [metadataURI, setMetadataURI] = useState<string>('');

  const { config } = usePrepareContractWrite({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: ProfileRegistryABI,
    functionName: 'setProfile',
    args: metadataURI ? [metadataURI] : undefined,
    enabled: !!metadataURI,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const setProfile = useCallback(
    (uri: string) => {
      setMetadataURI(uri);
      write?.();
    },
    [write]
  );

  return {
    setProfile,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

/**
 * Hook for reading user profile
 */
export function useProfile(address: string) {
  const { data, isError, isLoading, refetch } = useContractRead({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: ProfileRegistryABI,
    functionName: 'getProfile',
    args: [address as `0x${string}`],
    enabled: !!address,
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
