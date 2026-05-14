/**
 * MakeOfferModal Component
 *
 * Modal for submitting offers on NFTs with:
 * - Price input with USDC validation
 * - Expiration date selector
 * - USDC balance check and approval flow
 * - Offer preview with fees
 * - Transaction confirmation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn, formatUSDC } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { NFT } from '@/types';

export interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT;
  floorPrice?: bigint;
  currentBalance?: bigint;
  onSubmit: (offer: OfferData) => Promise<void>;
}

export interface OfferData {
  price: bigint;
  expirationDays: number;
}

type Step = 'input' | 'review' | 'submitting' | 'success' | 'error';

const EXPIRATION_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
];

export function MakeOfferModal({
  isOpen,
  onClose,
  nft,
  floorPrice,
  currentBalance = BigInt(0),
  onSubmit,
}: MakeOfferModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [priceInput, setPriceInput] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPriceInput('');
      setExpirationDays(7);
      setError(null);
    }
  }, [isOpen]);

  // Parse price input to bigint (USDC has 6 decimals)
  const parsePrice = (value: string): bigint | null => {
    try {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) return null;
      return BigInt(Math.floor(num * 1_000_000));
    } catch {
      return null;
    }
  };

  const offerPrice = parsePrice(priceInput);
  const hasBalance = offerPrice ? currentBalance >= offerPrice : false;

  // Calculate floor difference
  const floorDifference = floorPrice && offerPrice
    ? ((Number(offerPrice - floorPrice) / Number(floorPrice)) * 100)
    : null;

  const handlePriceChange = (value: string) => {
    // Allow only numbers and one decimal point
    const sanitized = value.replace(/[^\d.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) return; // Multiple decimals
    if (parts[1] && parts[1].length > 2) return; // More than 2 decimal places

    setPriceInput(sanitized);
    setError(null);
  };

  const handleReview = () => {
    if (!offerPrice) {
      setError('Please enter a valid offer amount');
      return;
    }
    if (offerPrice < BigInt(1_000_000)) {
      setError('Minimum offer is 1 USDC');
      return;
    }
    if (!hasBalance) {
      setError('Insufficient USDC balance');
      return;
    }
    setStep('review');
  };

  const handleSubmit = async () => {
    if (!offerPrice) return;

    setStep('submitting');
    try {
      await onSubmit({
        price: offerPrice,
        expirationDays,
      });
      setStep('success');
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit offer:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit offer');
      setStep('error');
    }
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h2 id="offer-modal-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
              {step === 'input' && 'Make an Offer'}
              {step === 'review' && 'Review Offer'}
              {step === 'submitting' && 'Submitting...'}
              {step === 'success' && 'Offer Submitted!'}
              {step === 'error' && 'Error'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Input Step */}
            {step === 'input' && (
              <div className="space-y-6">
                {/* NFT Info */}
                <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700">
                    {/* NFT image would go here */}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                      {nft.name || `#${nft.tokenId}`}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {nft.collection.name}
                    </p>
                  </div>
                </div>

                {/* Price Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Offer Amount
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={priceInput}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={cn(
                        'pr-16 text-lg font-semibold',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                      USDC
                    </span>
                  </div>

                  {/* Balance Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Balance:</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {formatUSDC(currentBalance)}
                    </span>
                  </div>

                  {/* Floor Price Info */}
                  {floorPrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Floor Price:</span>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {formatUSDC(floorPrice)}
                      </span>
                    </div>
                  )}

                  {/* Floor Difference */}
                  {floorDifference !== null && offerPrice && (
                    <div className="rounded-lg bg-neutral-100 p-2 text-center dark:bg-neutral-800">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          floorDifference >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {floorDifference >= 0 ? '+' : ''}
                        {floorDifference.toFixed(1)}% {floorDifference >= 0 ? 'above' : 'below'} floor
                      </span>
                    </div>
                  )}
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Offer Expiration
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {EXPIRATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setExpirationDays(option.value)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          expirationDays === option.value
                            ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Expires in {expirationDays} {expirationDays === 1 ? 'day' : 'days'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleReview}
                  disabled={!offerPrice || !hasBalance}
                >
                  Review Offer
                </Button>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && offerPrice && (
              <div className="space-y-6">
                <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Offer Amount</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatUSDC(offerPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Expiration</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {expirationDays} {expirationDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  {floorDifference !== null && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">vs Floor</span>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          floorDifference >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {floorDifference >= 0 ? '+' : ''}
                        {floorDifference.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <AlertCircle className="mr-2 inline h-4 w-4" />
                  By submitting this offer, you agree to purchase this item if the seller accepts.
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" fullWidth onClick={handleBack}>
                    Back
                  </Button>
                  <Button size="lg" fullWidth onClick={handleSubmit}>
                    Submit Offer
                  </Button>
                </div>
              </div>
            )}

            {/* Submitting Step */}
            {step === 'submitting' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  Submitting your offer...
                </p>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                  Offer Submitted!
                </p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  The seller will be notified of your offer
                </p>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                    <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                    Failed to Submit
                  </p>
                  {error && (
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {error}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" fullWidth onClick={onClose}>
                    Cancel
                  </Button>
                  <Button size="lg" fullWidth onClick={handleBack}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
