/**
 * Create Auction Modal Component
 *
 * Handles auction creation flow with NFT approval and parameters
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Gavel, AlertCircle, CheckCircle2, ExternalLink, Loader2, Clock } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '@/components/ui/Modal';
import { NFTApproval } from './USDCApproval';
import {
  cn,
  formatUSDC,
  parseUSDC,
  getImageUrl,
  getTransactionUrl,
} from '@/lib/utils';
import type { NFT, Address } from '@/types';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

enum AuctionStep {
  INPUT = 'input',
  APPROVAL = 'approval',
  CREATING = 'creating',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

const DURATION_OPTIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '6 Hours', value: 21600 },
  { label: '1 Day', value: 86400 },
  { label: '3 Days', value: 259200 },
  { label: '7 Days', value: 604800 },
  { label: '14 Days', value: 1209600 },
  { label: '30 Days', value: 2592000 },
];

export function CreateAuctionModal({ isOpen, onClose, nft, onSuccess }: CreateAuctionModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<AuctionStep>(AuctionStep.INPUT);
  const [minBid, setMinBid] = useState('');
  const [duration, setDuration] = useState(DURATION_OPTIONS[2].value); // Default to 1 day
  const [error, setError] = useState<string | null>(null);

  const minBidInUSDC = minBid ? parseUSDC(minBid) : BigInt(0);
  const isMinBidValid = minBidInUSDC > BigInt(0);

  // Create auction transaction
  const {
    data: auctionHash,
    writeContract: createAuction,
    isPending: isCreating,
    error: auctionError,
  } = useWriteContract();

  // Wait for auction transaction
  const { isLoading: isConfirming, isSuccess: isAuctionSuccess } = useWaitForTransactionReceipt({
    hash: auctionHash,
  });

  // Update step based on transaction status
  useEffect(() => {
    if (isCreating) {
      setStep(AuctionStep.CREATING);
    } else if (isConfirming) {
      setStep(AuctionStep.CONFIRMING);
    } else if (isAuctionSuccess) {
      setStep(AuctionStep.SUCCESS);
      onSuccess?.();
    } else if (auctionError) {
      setStep(AuctionStep.ERROR);
      setError(auctionError.message);
    }
  }, [isCreating, isConfirming, isAuctionSuccess, auctionError, onSuccess]);

  const handleApprovalComplete = () => {
    setStep(AuctionStep.INPUT);
  };

  const handleCreateAuction = () => {
    if (!address || !isMinBidValid) return;

    setError(null);
    const endTime = Math.floor(Date.now() / 1000) + duration;

    createAuction({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'createAuction',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'minBid', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'createAuction',
      args: [nft.collection.id as Address, BigInt(nft.tokenId), minBidInUSDC, BigInt(endTime)],
    });
  };

  const handleClose = () => {
    if (step === AuctionStep.CREATING || step === AuctionStep.CONFIRMING) {
      return;
    }
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);

  // Suggested minimum bids
  const suggestedBids = nft.collection.floorPrice
    ? [
        parseUSDC(nft.collection.floorPrice) * BigInt(80) / BigInt(100), // 80% of floor
        parseUSDC(nft.collection.floorPrice), // Floor price
        parseUSDC(nft.collection.floorPrice) * BigInt(120) / BigInt(100), // 120% of floor
      ]
    : [parseUSDC('5'), parseUSDC('25'), parseUSDC('50')];

  // Calculate end date
  const endDate = new Date(Date.now() + duration * 1000);
  const selectedDuration = DURATION_OPTIONS.find((opt) => opt.value === duration);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Auction"
      description="Set up an auction for your NFT"
      size="lg"
      closeOnOverlayClick={step !== AuctionStep.CREATING && step !== AuctionStep.CONFIRMING}
    >
      <div className="space-y-6">
        {/* NFT Preview */}
        <ModalSection title="Item">
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={imageUrl} alt={nft.name || `NFT #${nft.tokenId}`} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{nft.collection.name}</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{nft.name || `#${nft.tokenId}`}</p>
              {nft.collection.floorPrice && (
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Floor: {formatUSDC(parseUSDC(nft.collection.floorPrice))}
                </p>
              )}
            </div>
          </div>
        </ModalSection>

        {/* Auction Parameters */}
        {step === AuctionStep.INPUT && (
          <>
            <ModalSection title="Minimum Bid">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-lg font-semibold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    USDC
                  </span>
                </div>

                {/* Suggested Minimum Bids */}
                <div>
                  <p className="mb-2 text-xs text-gray-600 dark:text-neutral-400">Suggested minimum bids</p>
                  <div className="flex gap-2">
                    {suggestedBids.map((suggestedBid, index) => (
                      <button
                        key={index}
                        onClick={() => setMinBid(formatUSDC(suggestedBid, 2).replace(' USDC', ''))}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        {formatUSDC(suggestedBid)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ModalSection>

            <ModalSection title="Duration">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      duration === option.value
                        ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                <Clock className="h-4 w-4" />
                <span>
                  Auction will end on {endDate.toLocaleDateString()} at {endDate.toLocaleTimeString()}
                </span>
              </div>
            </ModalSection>

            {/* Auction Summary */}
            {isMinBidValid && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                <h3 className="mb-3 text-sm font-semibold text-purple-900 dark:text-purple-300">Auction Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-neutral-400">Minimum bid</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatUSDC(minBidInUSDC)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-neutral-400">Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedDuration?.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-neutral-400">Marketplace fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">2.5% of final bid</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-purple-200 dark:border-purple-700 pt-2">
                    <span className="font-medium text-gray-900 dark:text-white">Minimum you'll receive</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatUSDC(minBidInUSDC * BigInt(975) / BigInt(1000))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* NFT Approval */}
        {isMinBidValid && address && (
          <NFTApproval
            collectionAddress={nft.collection.id as Address}
            tokenId={nft.tokenId}
            spender={MARKETPLACE_ADDRESS}
            onApprovalComplete={handleApprovalComplete}
          />
        )}

        {/* Transaction Status */}
        {step === AuctionStep.CREATING && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Waiting for wallet confirmation...</span>
            </div>
          </div>
        )}

        {step === AuctionStep.CONFIRMING && auctionHash && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Creating auction...</span>
              </div>
              <a
                href={getTransactionUrl(auctionHash)}
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

        {step === AuctionStep.SUCCESS && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Auction created successfully!</p>
                <p className="mt-1 text-xs text-green-700">
                  Your auction is now live with a minimum bid of {formatUSDC(minBidInUSDC)}. It will end in{' '}
                  {selectedDuration?.label.toLowerCase()}.
                </p>
                {auctionHash && (
                  <a
                    href={getTransactionUrl(auctionHash)}
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

        {step === AuctionStep.ERROR && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Auction creation failed</p>
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
          disabled={step === AuctionStep.CREATING || step === AuctionStep.CONFIRMING}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          {step === AuctionStep.SUCCESS ? 'Close' : 'Cancel'}
        </button>
        {step !== AuctionStep.SUCCESS && (
          <button
            onClick={handleCreateAuction}
            disabled={
              !address ||
              !isMinBidValid ||
              step === AuctionStep.CREATING ||
              step === AuctionStep.CONFIRMING
            }
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Gavel className="h-4 w-4" />
            {step === AuctionStep.CREATING || step === AuctionStep.CONFIRMING
              ? 'Processing...'
              : 'Create Auction'}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
