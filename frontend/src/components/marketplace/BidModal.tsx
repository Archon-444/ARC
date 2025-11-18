/**
 * Bid Modal Component
 *
 * Handles auction bidding flow with USDC approval and bid validation
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Gavel, AlertCircle, CheckCircle2, ExternalLink, Loader2, Clock } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '@/components/ui/Modal';
import { USDCApproval } from './USDCApproval';
import {
  cn,
  formatUSDC,
  parseUSDC,
  getImageUrl,
  truncateAddress,
  getTransactionUrl,
  getTimeRemaining,
  formatTimeRemaining,
} from '@/lib/utils';
import type { NFT, Auction, Address } from '@/types';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  auction: Auction;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;

enum BidStep {
  INPUT = 'input',
  APPROVAL = 'approval',
  BIDDING = 'bidding',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

export function BidModal({ isOpen, onClose, nft, auction, onSuccess }: BidModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<BidStep>(BidStep.INPUT);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(auction.endTime));

  // Update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const currentBid = parseUSDC(auction.highestBid && auction.highestBid !== '0' ? auction.highestBid : auction.minBid);
  const minNextBid = currentBid + currentBid / BigInt(20); // 5% increment
  const userBid = bidAmount ? parseUSDC(bidAmount) : BigInt(0);

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const userBalance = (balance as bigint) || BigInt(0);
  const hasInsufficientBalance = userBalance < userBid;
  const isBidTooLow = userBid < minNextBid;

  // Place bid transaction
  const {
    data: bidHash,
    writeContract: placeBid,
    isPending: isBidding,
    error: bidError,
  } = useWriteContract();

  // Wait for bid transaction
  const { isLoading: isConfirming, isSuccess: isBidSuccess } = useWaitForTransactionReceipt({
    hash: bidHash,
  });

  // Update step based on transaction status
  useEffect(() => {
    if (isBidding) {
      setStep(BidStep.BIDDING);
    } else if (isConfirming) {
      setStep(BidStep.CONFIRMING);
    } else if (isBidSuccess) {
      setStep(BidStep.SUCCESS);
      onSuccess?.();
    } else if (bidError) {
      setStep(BidStep.ERROR);
      setError(bidError.message);
    }
  }, [isBidding, isConfirming, isBidSuccess, bidError, onSuccess]);

  const handleApprovalComplete = () => {
    setStep(BidStep.INPUT);
  };

  const handleBid = () => {
    if (!address || hasInsufficientBalance || isBidTooLow || !bidAmount) return;

    setError(null);
    placeBid({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'placeBid',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'bidAmount', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'placeBid',
      args: [auction.collection, BigInt(auction.tokenId), userBid],
    });
  };

  const handleClose = () => {
    if (step === BidStep.BIDDING || step === BidStep.CONFIRMING) {
      return;
    }
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);
  const isAuctionExpired = timeRemaining.isExpired;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Place Bid"
      description="Bid on this auction"
      size="lg"
      closeOnOverlayClick={step !== BidStep.BIDDING && step !== BidStep.CONFIRMING}
    >
      <div className="space-y-6">
        {/* NFT Preview */}
        <ModalSection title="Item">
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={imageUrl} alt={nft.name || `NFT #${nft.tokenId}`} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">{nft.collection.name}</p>
              <p className="font-semibold text-gray-900 truncate">{nft.name || `#${nft.tokenId}`}</p>
              <p className="text-sm text-gray-600">Owner: {truncateAddress(nft.owner)}</p>
            </div>
          </div>
        </ModalSection>

        {/* Auction Info */}
        <ModalSection title="Auction Details">
          <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {auction.highestBid && auction.highestBid !== '0' ? 'Current Bid' : 'Minimum Bid'}
              </span>
              <span className="text-lg font-bold text-gray-900">{formatUSDC(currentBid)}</span>
            </div>

            {auction.highestBidder && auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Highest bidder</span>
                <span className="font-medium text-gray-900">
                  {truncateAddress(auction.highestBidder as Address)}
                </span>
              </div>
            )}

            {!isAuctionExpired && (
              <div className="flex items-center gap-2 border-t border-purple-200 pt-3 text-purple-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Ends in {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m{' '}
                  {timeRemaining.seconds}s
                </span>
              </div>
            )}
          </div>
        </ModalSection>

        {/* Auction Expired Warning */}
        {isAuctionExpired && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Auction ended</p>
                <p className="mt-1 text-xs text-red-700">This auction has expired. You can no longer place bids.</p>
              </div>
            </div>
          </div>
        )}

        {/* Bid Input */}
        {!isAuctionExpired && step === BidStep.INPUT && (
          <ModalSection title="Your Bid">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-lg font-semibold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  USDC
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Minimum bid</span>
                <span className="font-medium text-gray-900">{formatUSDC(minNextBid)}</span>
              </div>

              {address && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your balance</span>
                  <span className={cn('font-medium', hasInsufficientBalance ? 'text-red-600' : 'text-gray-900')}>
                    {formatUSDC(userBalance)}
                  </span>
                </div>
              )}
            </div>
          </ModalSection>
        )}

        {/* Validation Errors */}
        {!isAuctionExpired && bidAmount && isBidTooLow && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Bid too low</p>
                <p className="mt-1 text-xs text-yellow-700">
                  Your bid must be at least {formatUSDC(minNextBid)} (5% above current bid).
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAuctionExpired && bidAmount && hasInsufficientBalance && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Insufficient balance</p>
                <p className="mt-1 text-xs text-red-700">
                  You need {formatUSDC(userBid - userBalance)} more USDC to place this bid.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* USDC Approval */}
        {!isAuctionExpired && bidAmount && !hasInsufficientBalance && !isBidTooLow && address && (
          <USDCApproval
            spender={MARKETPLACE_ADDRESS}
            amount={bidAmount}
            onApprovalComplete={handleApprovalComplete}
          />
        )}

        {/* Transaction Status */}
        {step === BidStep.BIDDING && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Waiting for wallet confirmation...</span>
            </div>
          </div>
        )}

        {step === BidStep.CONFIRMING && bidHash && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Processing bid...</span>
              </div>
              <a
                href={getTransactionUrl(bidHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
              >
                View transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {step === BidStep.SUCCESS && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Bid placed successfully!</p>
                <p className="mt-1 text-xs text-green-700">
                  Your bid of {formatUSDC(userBid)} has been placed. You'll be notified if you're outbid.
                </p>
                {bidHash && (
                  <a
                    href={getTransactionUrl(bidHash)}
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
        )}

        {step === BidStep.ERROR && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Bid failed</p>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        <button
          onClick={handleClose}
          disabled={step === BidStep.BIDDING || step === BidStep.CONFIRMING}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {step === BidStep.SUCCESS ? 'Close' : 'Cancel'}
        </button>
        {step !== BidStep.SUCCESS && !isAuctionExpired && (
          <button
            onClick={handleBid}
            disabled={
              !address ||
              !bidAmount ||
              hasInsufficientBalance ||
              isBidTooLow ||
              step === BidStep.BIDDING ||
              step === BidStep.CONFIRMING
            }
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Gavel className="h-4 w-4" />
            {step === BidStep.BIDDING || step === BidStep.CONFIRMING
              ? 'Processing...'
              : `Place Bid${bidAmount ? ` - ${formatUSDC(userBid)}` : ''}`}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
