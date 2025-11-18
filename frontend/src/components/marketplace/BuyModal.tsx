/**
 * Buy Modal Component
 *
 * Handles NFT purchase flow with USDC approval and transaction tracking
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShoppingCart, AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '@/components/ui/Modal';
import { USDCApproval } from './USDCApproval';
import {
  cn,
  formatUSDC,
  parseUSDC,
  getImageUrl,
  truncateAddress,
  getTransactionUrl,
} from '@/lib/utils';
import type { NFT, Listing, Address } from '@/types';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  listing: Listing;
  onSuccess?: () => void;
}

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;

enum BuyStep {
  APPROVAL = 'approval',
  PURCHASE = 'purchase',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

export function BuyModal({ isOpen, onClose, nft, listing, onSuccess }: BuyModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<BuyStep>(BuyStep.APPROVAL);
  const [error, setError] = useState<string | null>(null);

  const price = parseUSDC(listing.price);

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
  const hasInsufficientBalance = userBalance < price;

  // Buy NFT transaction
  const {
    data: buyHash,
    writeContract: buyNFT,
    isPending: isBuying,
    error: buyError,
  } = useWriteContract();

  // Wait for buy transaction
  const { isLoading: isConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  // Update step based on transaction status
  useEffect(() => {
    if (isBuying) {
      setStep(BuyStep.PURCHASE);
    } else if (isConfirming) {
      setStep(BuyStep.CONFIRMING);
    } else if (isBuySuccess) {
      setStep(BuyStep.SUCCESS);
      onSuccess?.();
    } else if (buyError) {
      setStep(BuyStep.ERROR);
      setError(buyError.message);
    }
  }, [isBuying, isConfirming, isBuySuccess, buyError, onSuccess]);

  const handleApprovalComplete = () => {
    // Approval complete, ready to buy
    setStep(BuyStep.APPROVAL);
  };

  const handleBuy = () => {
    if (!address || hasInsufficientBalance) return;

    setError(null);
    buyNFT({
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          name: 'buyNFT',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'collection', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'buyNFT',
      args: [listing.collection, BigInt(listing.tokenId)],
    });
  };

  const handleClose = () => {
    if (step === BuyStep.PURCHASE || step === BuyStep.CONFIRMING) {
      // Don't allow closing during transaction
      return;
    }
    onClose();
  };

  const imageUrl = getImageUrl(nft.image);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Buy NFT"
      description="Complete your purchase"
      size="lg"
      closeOnOverlayClick={step !== BuyStep.PURCHASE && step !== BuyStep.CONFIRMING}
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

        {/* Price */}
        <ModalSection title="Price">
          <div className="flex items-baseline justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatUSDC(price)}</span>
          </div>
        </ModalSection>

        {/* Balance Check */}
        {address && (
          <div className="text-sm text-gray-600">
            Your balance:{' '}
            <span className={cn('font-medium', hasInsufficientBalance ? 'text-red-600' : 'text-gray-900')}>
              {formatUSDC(userBalance)}
            </span>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {hasInsufficientBalance && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Insufficient balance</p>
                <p className="mt-1 text-xs text-red-700">
                  You need {formatUSDC(price - userBalance)} more USDC to complete this purchase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* USDC Approval */}
        {!hasInsufficientBalance && address && (
          <USDCApproval
            spender={MARKETPLACE_ADDRESS}
            amount={listing.price}
            onApprovalComplete={handleApprovalComplete}
          />
        )}

        {/* Transaction Status */}
        {step === BuyStep.PURCHASE && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Waiting for wallet confirmation...</span>
            </div>
          </div>
        )}

        {step === BuyStep.CONFIRMING && buyHash && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Processing purchase...</span>
              </div>
              <a
                href={getTransactionUrl(buyHash)}
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

        {step === BuyStep.SUCCESS && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Purchase successful!</p>
                <p className="mt-1 text-xs text-green-700">
                  The NFT has been transferred to your wallet.
                </p>
                {buyHash && (
                  <a
                    href={getTransactionUrl(buyHash)}
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

        {step === BuyStep.ERROR && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Purchase failed</p>
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
          disabled={step === BuyStep.PURCHASE || step === BuyStep.CONFIRMING}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {step === BuyStep.SUCCESS ? 'Close' : 'Cancel'}
        </button>
        {step !== BuyStep.SUCCESS && (
          <button
            onClick={handleBuy}
            disabled={
              !address ||
              hasInsufficientBalance ||
              step === BuyStep.PURCHASE ||
              step === BuyStep.CONFIRMING
            }
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {step === BuyStep.PURCHASE || step === BuyStep.CONFIRMING
              ? 'Processing...'
              : `Buy for ${formatUSDC(price)}`}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
