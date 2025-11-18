/**
 * List NFT Modal Component
 *
 * Handles NFT listing flow with approval and price setting
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Tag, AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
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

interface ListNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

enum ListStep {
  INPUT = 'input',
  APPROVAL = 'approval',
  LISTING = 'listing',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

export function ListNFTModal({ isOpen, onClose, nft, onSuccess }: ListNFTModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<ListStep>(ListStep.INPUT);
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const priceInUSDC = price ? parseUSDC(price) : BigInt(0);
  const isPriceValid = priceInUSDC > BigInt(0);

  // List NFT transaction
  const {
    data: listHash,
    writeContract: listNFT,
    isPending: isListing,
    error: listError,
  } = useWriteContract();

  // Wait for list transaction
  const { isLoading: isConfirming, isSuccess: isListSuccess } = useWaitForTransactionReceipt({
    hash: listHash,
  });

  // Update step based on transaction status
  useEffect(() => {
    if (isListing) {
      setStep(ListStep.LISTING);
    } else if (isConfirming) {
      setStep(ListStep.CONFIRMING);
    } else if (isListSuccess) {
      setStep(ListStep.SUCCESS);
      onSuccess?.();
    } else if (listError) {
      setStep(ListStep.ERROR);
      setError(listError.message);
    }
  }, [isListing, isConfirming, isListSuccess, listError, onSuccess]);

  const handleApprovalComplete = () => {
    setStep(ListStep.INPUT);
  };

  const handleList = () => {
    if (!address || !isPriceValid) return;

    setError(null);
    listNFT({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'listNFT',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'price', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'listNFT',
      args: [nft.collection.id as Address, BigInt(nft.tokenId), priceInUSDC],
    });
  };

  const handleClose = () => {
    if (step === ListStep.LISTING || step === ListStep.CONFIRMING) {
      return;
    }
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);

  // Suggested prices based on collection floor (if available)
  const suggestedPrices = nft.collection.floorPrice
    ? [
        parseUSDC(nft.collection.floorPrice),
        parseUSDC(nft.collection.floorPrice) * BigInt(105) / BigInt(100), // 5% above floor
        parseUSDC(nft.collection.floorPrice) * BigInt(110) / BigInt(100), // 10% above floor
      ]
    : [parseUSDC('10'), parseUSDC('50'), parseUSDC('100')];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="List NFT for Sale"
      description="Set a price for your NFT"
      size="lg"
      closeOnOverlayClick={step !== ListStep.LISTING && step !== ListStep.CONFIRMING}
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
              {nft.collection.floorPrice && (
                <p className="text-sm text-gray-600">
                  Floor: {formatUSDC(parseUSDC(nft.collection.floorPrice))}
                </p>
              )}
            </div>
          </div>
        </ModalSection>

        {/* Price Input */}
        {step === ListStep.INPUT && (
          <ModalSection title="Set Price">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  USDC
                </span>
              </div>

              {/* Suggested Prices */}
              <div>
                <p className="mb-2 text-xs text-gray-600">Suggested prices</p>
                <div className="flex gap-2">
                  {suggestedPrices.map((suggestedPrice, index) => (
                    <button
                      key={index}
                      onClick={() => setPrice(formatUSDC(suggestedPrice, 2).replace(' USDC', ''))}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {formatUSDC(suggestedPrice)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Info */}
              {isPriceValid && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Listing price</span>
                    <span className="font-medium text-gray-900">{formatUSDC(priceInUSDC)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-gray-600">Marketplace fee (2.5%)</span>
                    <span className="font-medium text-gray-900">
                      {formatUSDC(priceInUSDC * BigInt(25) / BigInt(1000))}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="font-medium text-gray-900">You'll receive</span>
                    <span className="font-bold text-gray-900">
                      {formatUSDC(priceInUSDC * BigInt(975) / BigInt(1000))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ModalSection>
        )}

        {/* NFT Approval */}
        {isPriceValid && address && (
          <NFTApproval
            collectionAddress={nft.collection.id as Address}
            tokenId={nft.tokenId}
            spender={MARKETPLACE_ADDRESS}
            onApprovalComplete={handleApprovalComplete}
          />
        )}

        {/* Transaction Status */}
        {step === ListStep.LISTING && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Waiting for wallet confirmation...</span>
            </div>
          </div>
        )}

        {step === ListStep.CONFIRMING && listHash && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Creating listing...</span>
              </div>
              <a
                href={getTransactionUrl(listHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                View transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {step === ListStep.SUCCESS && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">NFT listed successfully!</p>
                <p className="mt-1 text-xs text-green-700">
                  Your NFT is now listed for {formatUSDC(priceInUSDC)}. Buyers can purchase it immediately.
                </p>
                {listHash && (
                  <a
                    href={getTransactionUrl(listHash)}
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

        {step === ListStep.ERROR && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Listing failed</p>
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
          disabled={step === ListStep.LISTING || step === ListStep.CONFIRMING}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {step === ListStep.SUCCESS ? 'Close' : 'Cancel'}
        </button>
        {step !== ListStep.SUCCESS && (
          <button
            onClick={handleList}
            disabled={
              !address ||
              !isPriceValid ||
              step === ListStep.LISTING ||
              step === ListStep.CONFIRMING
            }
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Tag className="h-4 w-4" />
            {step === ListStep.LISTING || step === ListStep.CONFIRMING
              ? 'Processing...'
              : `List for ${price ? formatUSDC(priceInUSDC) : 'Sale'}`}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
