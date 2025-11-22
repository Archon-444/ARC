/**
 * EmptyState Component
 *
 * Displays friendly messages when there's no content to show
 * Improves UX by providing context and guidance
 */

'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  } | React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {/* Icon */}
      {Icon && (
        <div className="mb-4 rounded-full bg-neutral-100 p-6 dark:bg-neutral-800">
          <Icon className="h-12 w-12 text-neutral-400 dark:text-neutral-500" />
        </div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-md text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        // Check if action is a ReactNode (not an object with label)
        React.isValidElement(action) ? (
          action
        ) : (
          // It's the object shape
          (action as any).href ? (
            <Link
              href={(action as any).href}
              className="btn-primary"
            >
              {(action as any).label}
            </Link>
          ) : (
            <button
              onClick={(action as any).onClick}
              className="btn-primary"
            >
              {(action as any).label}
            </button>
          )
        )
      )}
    </div>
  );
}

/**
 * Preset empty states for common scenarios
 */

import {
  PackageOpen,
  Search,
  Image as ImageIcon,
  Heart,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Inbox,
  Users,
  FileText,
} from 'lucide-react';

export function NoNFTsFound() {
  return (
    <EmptyState
      icon={PackageOpen}
      title="No NFTs found"
      description="We couldn't find any NFTs matching your criteria. Try adjusting your filters or search terms."
    />
  );
}

export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try different keywords or check your spelling. You can also browse our featured collections."
      action={{
        label: 'Browse Collections',
        href: '/explore',
      }}
    />
  );
}

export function NoCollectionsFound() {
  return (
    <EmptyState
      icon={ImageIcon}
      title="No collections yet"
      description="Start exploring NFT collections or create your own."
      action={{
        label: 'Explore Collections',
        href: '/explore',
      }}
    />
  );
}

export function NoFavorites() {
  return (
    <EmptyState
      icon={Heart}
      title="No favorites yet"
      description="Start exploring and save your favorite NFTs to see them here."
      action={{
        label: 'Explore NFTs',
        href: '/explore',
      }}
    />
  );
}

export function NoListings() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No active listings"
      description="This NFT is not currently listed for sale."
    />
  );
}

export function NoActivity() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No activity yet"
      description="Recent transactions and bids will appear here."
    />
  );
}

export function NoOffers() {
  return (
    <EmptyState
      icon={Inbox}
      title="No offers yet"
      description="You haven't received any offers for this NFT."
    />
  );
}

export function NoFollowing() {
  return (
    <EmptyState
      icon={Users}
      title="Not following anyone"
      description="Follow creators and collectors to see their activity here."
      action={{
        label: 'Discover Creators',
        href: '/explore',
      }}
    />
  );
}

export function NotConnected() {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Wallet not connected"
      description="Connect your wallet to view this content."
      action={{
        label: 'Connect Wallet',
        onClick: () => {
          // This will be handled by wallet connection logic
          window.dispatchEvent(new CustomEvent('openWalletModal'));
        },
      }}
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : undefined}
    />
  );
}

export function NoData({
  icon = FileText,
  title = 'No data available',
  description,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
    />
  );
}
