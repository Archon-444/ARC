'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_NFT } from '@/graphql/queries';
import {
  useBuyItem,
  usePlaceBid,
  useSettleAuction,
  useApproveUSDC,
  useUSDCBalance,
  useUSDCAllowance,
  formatUSDC,
  parseUSDC,
} from '@/hooks/useMarketplace';

export default function NFTDetailPage() {
  const params = useParams();
  const collectionAddress = params?.collection as string;
  const tokenId = params?.id as string;

  const { address: userAddress } = useAccount();
  const [nft, setNFT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);

  const { buyItem, isLoading: isBuying, isSuccess: buySuccess } = useBuyItem();
  const { placeBid, isLoading: isBidding, isSuccess: bidSuccess } = usePlaceBid();
  const { settleAuction, isLoading: isSettling } = useSettleAuction();
  const { approve: approveUSDC, isLoading: isApproving } = useApproveUSDC();
  const { balance: usdcBalance, balanceFormatted } = useUSDCBalance(userAddress || '');
  const { allowance: usdcAllowance } = useUSDCAllowance(userAddress || '');

  useEffect(() => {
    if (collectionAddress && tokenId) {
      loadNFT();
    }
  }, [collectionAddress, tokenId]);

  useEffect(() => {
    if (buySuccess || bidSuccess) {
      // Reload NFT data after successful transaction
      setTimeout(() => loadNFT(), 2000);
    }
  }, [buySuccess, bidSuccess]);

  const loadNFT = async () => {
    setLoading(true);
    try {
      const nftId = `${collectionAddress.toLowerCase()}-${tokenId}`;
      const data: any = await fetchGraphQL(GET_NFT, { id: nftId });

      if (data.nft) {
        setNFT(data.nft);
      }
    } catch (error) {
      console.error('Error loading NFT:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!nft?.listing?.active) return;

    const price = BigInt(nft.listing.price);
    const needsApproval = !usdcAllowance || BigInt(usdcAllowance) < price;

    if (needsApproval) {
      await approveUSDC(formatUSDC(price));
    }

    buyItem(collectionAddress, tokenId);
  };

  const handleBid = async () => {
    if (!bidAmount || !nft?.auction) return;

    const bidValue = parseUSDC(bidAmount);
    const needsApproval = !usdcAllowance || BigInt(usdcAllowance) < bidValue;

    if (needsApproval) {
      await approveUSDC(bidAmount);
    }

    placeBid(collectionAddress, tokenId, bidAmount);
    setShowBidModal(false);
    setBidAmount('');
  };

  const handleSettle = async () => {
    settleAuction(collectionAddress, tokenId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NFT Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This NFT doesn't exist or hasn't been indexed yet.
        </p>
        <Link
          href="/explore"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Browse NFTs
        </Link>
      </div>
    );
  }

  const imageUrl = nft.tokenURI?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '/placeholder-nft.png';
  const isOwner = userAddress?.toLowerCase() === nft.owner?.id?.toLowerCase();
  const isSeller = userAddress?.toLowerCase() === nft.listing?.seller?.id?.toLowerCase();
  const hasActiveListing = nft.listing?.active;
  const hasActiveAuction = nft.auction && !nft.auction.settled;
  const auctionEnded = hasActiveAuction && Date.now() > parseInt(nft.auction.endTime) * 1000;

  const minBid = hasActiveAuction
    ? nft.auction.highestBid && BigInt(nft.auction.highestBid) > BigInt(0)
      ? BigInt(nft.auction.highestBid)
      : BigInt(nft.auction.reservePrice)
    : BigInt(0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={imageUrl}
              alt={`${nft.collection.name} #${nft.tokenId}`}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Properties/Traits could go here */}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Collection & Token ID */}
          <div>
            <Link
              href={`/collections/${nft.collection.address}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {nft.collection.name || 'Unknown Collection'}
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
              #{nft.tokenId}
            </h1>
          </div>

          {/* Owner Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Owned by</p>
              <Link
                href={`/profile/${nft.owner.address}`}
                className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                {isOwner ? 'You' : `${nft.owner.address.slice(0, 6)}...${nft.owner.address.slice(-4)}`}
              </Link>
            </div>
            {nft.creator && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                <Link
                  href={`/profile/${nft.creator.address}`}
                  className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {nft.creator.address.slice(0, 6)}...{nft.creator.address.slice(-4)}
                </Link>
              </div>
            )}
          </div>

          {/* Listing Info */}
          {hasActiveListing && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Price</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatUSDC(BigInt(nft.listing.price))}
                </span>
                <span className="text-xl text-gray-600 dark:text-gray-400">USDC</span>
              </div>

              {!isOwner && (
                <button
                  onClick={handleBuy}
                  disabled={isBuying || isApproving}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {isBuying ? 'Buying...' : isApproving ? 'Approving...' : 'Buy Now'}
                </button>
              )}

              {isSeller && (
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Update Price
                  </button>
                  <button className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                    Cancel Listing
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auction Info */}
          {hasActiveAuction && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {auctionEnded ? 'Auction Ended' : 'Current Bid'}
                </p>
                {!auctionEnded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ends in{' '}
                    {Math.floor((parseInt(nft.auction.endTime) * 1000 - Date.now()) / 3600000)}h
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {nft.auction.highestBid && BigInt(nft.auction.highestBid) > BigInt(0)
                    ? formatUSDC(BigInt(nft.auction.highestBid))
                    : formatUSDC(BigInt(nft.auction.reservePrice))}
                </span>
                <span className="text-xl text-gray-600 dark:text-gray-400">USDC</span>
              </div>

              {nft.auction.highestBidder && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Highest bidder:{' '}
                  {nft.auction.highestBidder.address.slice(0, 6)}...
                  {nft.auction.highestBidder.address.slice(-4)}
                </p>
              )}

              {!auctionEnded && !isOwner && (
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Place Bid
                </button>
              )}

              {auctionEnded && (
                <button
                  onClick={handleSettle}
                  disabled={isSettling}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  {isSettling ? 'Settling...' : 'Settle Auction'}
                </button>
              )}
            </div>
          )}

          {/* If owned but not listed */}
          {isOwner && !hasActiveListing && !hasActiveAuction && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You own this NFT. List it for sale or create an auction.
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  List for Sale
                </button>
                <button className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                  Create Auction
                </button>
              </div>
            </div>
          )}

          {/* Activity History */}
          {nft.sales && nft.sales.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sale History
              </h3>
              <div className="space-y-3">
                {nft.sales.slice(0, 5).map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sale.saleType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(parseInt(sale.createdAt) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatUSDC(BigInt(sale.price))} USDC
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Place a Bid</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bid Amount (USDC)
              </label>
              <input
                type="number"
                step="0.01"
                min={formatUSDC(minBid)}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: ${formatUSDC(minBid)}`}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your balance: {balanceFormatted} USDC
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBid}
                disabled={!bidAmount || isBidding || isApproving || parseFloat(bidAmount) < parseFloat(formatUSDC(minBid))}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isBidding ? 'Placing...' : isApproving ? 'Approving...' : 'Place Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
