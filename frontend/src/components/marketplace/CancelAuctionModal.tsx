/**
 * Cancel Auction Modal Component
 *
 * Handles auction cancellation with confirmation and warnings
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { XCircle, AlertCircle, CheckCircle2, ExternalLink, Loader2, Clock } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn, formatUSDC, getImageUrl, getTransactionUrl, getTimeRemaining } from '@/lib/utils';
import type { NFT, Auction, Address } from '@/types';

interface CancelAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  auction: Auction;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

export function CancelAuctionModal({
  isOpen,
  onClose,
  nft,
  auction,
  onSuccess,
}: CancelAuctionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(auction.endTime));

  // Update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  // Cancel auction transaction
  const {
    data: cancelHash,
    writeContract: cancelAuction,
    isPending: isCanceling,
    error: cancelError,
  } = useWriteContract();

  // Wait for cancel transaction
  const { isLoading: isConfirming, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });

  // Update success state
  useEffect(() => {
    if (isCancelSuccess) {
      setIsSuccess(true);
      onSuccess?.();
    }
  }, [isCancelSuccess, onSuccess]);

  // Update error state
  useEffect(() => {
    if (cancelError) {
      setError(cancelError.message);
    }
  }, [cancelError]);

  const handleCancel = () => {
    setError(null);
    cancelAuction({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'cancelAuction',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'cancelAuction',
      args: [auction.collection, BigInt(auction.tokenId)],
    });
  };

  const handleClose = () => {
    if (isCanceling || isConfirming) return;
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);
  const hasBids =
    auction.highestBid &&
    auction.highestBid !== '0' &&
    auction.highestBidder &&
    auction.highestBidder !== '0x0000000000000000000000000000000000000000';

  // Success state
  if (isSuccess) {
    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleClose}
        title="Auction Cancelled"
        description=""
        confirmLabel="Close"
        confirmVariant="primary"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Auction cancelled successfully!</p>
                <p className="mt-1 text-xs text-green-700">
                  Your auction has been cancelled. {hasBids && 'Any bids have been refunded to the bidders.'}
                </p>
                {cancelHash && (
                  <a
                    href={getTransactionUrl(cancelHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    View transaction
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </ConfirmModal>
    );
  }

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleCancel}
      title="Cancel Auction"
      description="Are you sure you want to cancel this auction?"
      confirmLabel={isCanceling || isConfirming ? 'Processing...' : 'Cancel Auction'}
      cancelLabel="Keep Auction"
      confirmVariant="danger"
      isLoading={isCanceling || isConfirming}
    >
      <div className="space-y-4">
        {/* NFT Preview */}
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <Image src={imageUrl} alt={nft.name || `NFT #${nft.tokenId}`} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{nft.collection.name}</p>
            <p className="font-semibold text-gray-900 truncate">{nft.name || `#${nft.tokenId}`}</p>
            <p className="text-sm text-gray-600">
              {hasBids ? `Current bid: ${formatUSDC(auction.highestBid)}` : `Min bid: ${formatUSDC(auction.minBid)}`}
            </p>
            {!timeRemaining.isExpired && (
              <div className="flex items-center gap-1 text-xs text-purple-700">
                <Clock className="h-3 w-3" />
                <span>
                  {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status */}
        {(isCanceling || isConfirming) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {isCanceling ? 'Waiting for wallet confirmation...' : 'Cancelling auction...'}
                </span>
              </div>
              {cancelHash && (
                <a
                  href={getTransactionUrl(cancelHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  View transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Cancellation failed</p>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning if there are bids */}
        {!isCanceling && !isConfirming && !error && hasBids && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Warning: Active bids</p>
                <p className="mt-1 text-xs text-red-700">
                  This auction has active bids. Cancelling will refund the highest bidder automatically.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info if no bids */}
        {!isCanceling && !isConfirming && !error && !hasBids && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Note</p>
                <p className="mt-1 text-xs text-yellow-700">
                  Cancelling this auction will remove it from the marketplace. You can create a new auction
                  or list your NFT for sale at any time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfirmModal>
  );
}
