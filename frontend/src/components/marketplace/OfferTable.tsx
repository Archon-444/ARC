/**
 * OfferTable Component
 *
 * Displays offers made on an NFT with accept/decline actions
 * Shows offer price, expiration, and maker information
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, ExternalLink } from 'lucide-react';
import { cn, formatUSDC, truncateAddress, formatDistanceToNow } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface Offer {
  id: string;
  maker: string;
  price: bigint;
  expiresAt: Date;
  createdAt: Date;
  status: 'active' | 'expired' | 'accepted' | 'cancelled';
}

export interface OfferTableProps {
  offers: Offer[];
  isOwner?: boolean;
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function OfferTable({
  offers,
  isOwner = false,
  onAcceptOffer,
  onDeclineOffer,
  isLoading = false,
  className,
}: OfferTableProps) {
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);

  const activeOffers = offers.filter((offer) => {
    if (offer.status !== 'active') return false;
    return new Date(offer.expiresAt) > new Date();
  });

  const handleAccept = async (offerId: string) => {
    if (!onAcceptOffer) return;
    setProcessingOfferId(offerId);
    try {
      await onAcceptOffer(offerId);
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleDecline = async (offerId: string) => {
    if (!onDeclineOffer) return;
    setProcessingOfferId(offerId);
    try {
      await onDeclineOffer(offerId);
    } finally {
      setProcessingOfferId(null);
    }
  };

  if (isLoading) {
    return <OfferTableSkeleton />;
  }

  if (activeOffers.length === 0) {
    return (
      <div className={cn('rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50', className)}>
        <p className="text-neutral-500 dark:text-neutral-400">No active offers</p>
        <p className="mt-2 text-sm text-neutral-400">
          {isOwner ? 'Offers will appear here once someone makes one' : 'Be the first to make an offer!'}
        </p>
      </div>
    );
  }

  // Sort by price (highest first)
  const sortedOffers = [...activeOffers].sort((a, b) => {
    if (a.price > b.price) return -1;
    if (a.price < b.price) return 1;
    return 0;
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Best Offer</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatUSDC(sortedOffers[0].price)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Floor Difference</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {/* TODO: Calculate floor difference */}
              +12.3%
            </p>
          </div>
        </div>
        <Badge variant="info">{activeOffers.length} Active</Badge>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  USD Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Floor Difference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Expiration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  From
                </th>
                {isOwner && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
              <AnimatePresence mode="popLayout">
                {sortedOffers.map((offer, index) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    isHighest={index === 0}
                    isOwner={isOwner}
                    isProcessing={processingOfferId === offer.id}
                    onAccept={() => handleAccept(offer.id)}
                    onDecline={() => handleDecline(offer.id)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface OfferRowProps {
  offer: Offer;
  isHighest: boolean;
  isOwner: boolean;
  isProcessing: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

function OfferRow({ offer, isHighest, isOwner, isProcessing, onAccept, onDecline }: OfferRowProps) {
  const timeUntilExpiry = new Date(offer.expiresAt).getTime() - Date.now();
  const isExpiringSoon = timeUntilExpiry < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        isHighest && 'bg-primary-50/30 dark:bg-primary-900/10'
      )}
    >
      {/* Price */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold', isHighest ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-white')}>
            {formatUSDC(offer.price)}
          </span>
          {isHighest && (
            <Badge variant="success" className="text-xs">
              Best
            </Badge>
          )}
        </div>
      </td>

      {/* USD Price */}
      <td className="px-4 py-4">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {/* TODO: Add USD conversion */}
          ${(Number(offer.price) / 1_000_000).toFixed(2)}
        </span>
      </td>

      {/* Floor Difference */}
      <td className="px-4 py-4">
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          {/* TODO: Calculate actual floor difference */}
          +{Math.floor(Math.random() * 20)}%
        </span>
      </td>

      {/* Expiration */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <Clock className={cn('h-3.5 w-3.5', isExpiringSoon ? 'text-orange-500' : 'text-neutral-400')} />
          <span className={cn('text-sm', isExpiringSoon ? 'font-medium text-orange-600 dark:text-orange-400' : 'text-neutral-600 dark:text-neutral-400')}>
            {formatDistanceToNow(offer.expiresAt)}
          </span>
        </div>
      </td>

      {/* From */}
      <td className="px-4 py-4">
        <Link
          href={`/profile/${offer.maker}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {truncateAddress(offer.maker)}
        </Link>
      </td>

      {/* Actions */}
      {isOwner && (
        <td className="px-4 py-4">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={onAccept}
              isLoading={isProcessing}
              disabled={isProcessing}
              className="whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDecline}
              disabled={isProcessing}
              aria-label="Decline offer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}
    </motion.tr>
  );
}

function OfferTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                USD Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Floor Difference
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Expiration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                From
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
