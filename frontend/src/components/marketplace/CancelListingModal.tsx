/**
 * Cancel Listing Modal Component
 *
 * Handles listing cancellation with confirmation
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { XCircle, AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn, formatUSDC, getImageUrl, getTransactionUrl } from '@/lib/utils';
import type { NFT, Listing, Address } from '@/types';

interface CancelListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  listing: Listing;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

export function CancelListingModal({
  isOpen,
  onClose,
  nft,
  listing,
  onSuccess,
}: CancelListingModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Cancel listing transaction
  const {
    data: cancelHash,
    writeContract: cancelListing,
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
    cancelListing({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'cancelListing',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'cancelListing',
      args: [listing.collection, BigInt(listing.tokenId)],
    });
  };

  const handleClose = () => {
    if (isCanceling || isConfirming) return;
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);

  // Success state
  if (isSuccess) {
    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleClose}
        title="Listing Cancelled"
        description=""
        confirmLabel="Close"
        confirmVariant="primary"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Listing cancelled successfully!</p>
                <p className="mt-1 text-xs text-green-700">
                  Your NFT is no longer listed for sale and is now available for you to list again or
                  create an auction.
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
      title="Cancel Listing"
      description="Are you sure you want to cancel this listing?"
      confirmLabel={isCanceling || isConfirming ? 'Processing...' : 'Cancel Listing'}
      cancelLabel="Keep Listing"
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
            <p className="text-sm text-gray-600">Listed for {formatUSDC(listing.price)}</p>
          </div>
        </div>

        {/* Transaction Status */}
        {(isCanceling || isConfirming) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {isCanceling ? 'Waiting for wallet confirmation...' : 'Cancelling listing...'}
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

        {/* Info */}
        {!isCanceling && !isConfirming && !error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Note</p>
                <p className="mt-1 text-xs text-yellow-700">
                  Cancelling this listing will remove it from the marketplace. You can list your NFT again
                  at any time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfirmModal>
  );
}
