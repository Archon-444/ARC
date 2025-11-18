import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUSDC } from '@/hooks/useMarketplace';

interface NFTCardProps {
  nft: {
    id: string;
    tokenId: string;
    tokenURI: string;
    collection: {
      id: string;
      name?: string;
      symbol?: string;
      address: string;
    };
    listing?: {
      id: string;
      price: string;
      active: boolean;
    };
    auction?: {
      id: string;
      highestBid?: string;
      reservePrice: string;
      endTime: string;
      settled: boolean;
    };
  };
}

export default function NFTCard({ nft }: NFTCardProps) {
  const { tokenId, tokenURI, collection, listing, auction } = nft;

  // Extract image URL from tokenURI (IPFS or HTTP)
  const imageUrl = tokenURI?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '/placeholder-nft.png';

  // Calculate time remaining for auction
  const getTimeRemaining = (endTime: string) => {
    const end = parseInt(endTime) * 1000;
    const now = Date.now();
    const remaining = end - now;

    if (remaining <= 0) return 'Ended';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Link
      href={`/nft/${collection.address}/${tokenId}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <div className="relative aspect-square">
        <Image
          src={imageUrl}
          alt={`${collection.name} #${tokenId}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {auction && !auction.settled && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
            Auction
          </div>
        )}
        {listing && listing.active && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
            Listed
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {collection.name || 'Unknown Collection'}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            #{tokenId}
          </span>
        </div>

        {listing && listing.active && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatUSDC(BigInt(listing.price))} USDC
            </p>
          </div>
        )}

        {auction && !auction.settled && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {auction.highestBid && BigInt(auction.highestBid) > BigInt(0) ? 'Current Bid' : 'Reserve'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeRemaining(auction.endTime)}
              </p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {auction.highestBid && BigInt(auction.highestBid) > BigInt(0)
                ? formatUSDC(BigInt(auction.highestBid))
                : formatUSDC(BigInt(auction.reservePrice))}{' '}
              USDC
            </p>
          </div>
        )}

        {!listing && !auction && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Not for sale</p>
          </div>
        )}
      </div>
    </Link>
  );
}
