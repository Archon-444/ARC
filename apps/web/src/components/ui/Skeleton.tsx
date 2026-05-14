/**
 * Skeleton Component
 *
 * Loading placeholders for content that's being fetched
 * Uses design tokens for consistent styling
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        'bg-neutral-200 dark:bg-neutral-800',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * NFT Card Skeleton - Matches NFTCard component structure
 */
export function NFTCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full" variant="rectangular" />

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Collection name */}
        <Skeleton className="h-3 w-1/2" />

        {/* NFT name */}
        <Skeleton className="h-5 w-3/4" />

        {/* Owner */}
        <Skeleton className="h-4 w-1/2" />

        {/* Price section */}
        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-700">
          <Skeleton className="mb-1 h-3 w-1/3" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-20" variant="rectangular" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Collection Card Skeleton
 */
export function CollectionCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Banner image */}
      <Skeleton className="h-24 w-full" variant="rectangular" />

      {/* Avatar */}
      <div className="relative px-4">
        <Skeleton
          className="-mt-8 h-16 w-16 border-4 border-white dark:border-neutral-800"
          variant="circular"
        />
      </div>

      {/* Content */}
      <div className="space-y-3 p-4 pt-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Item Skeleton
 */
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
      {/* NFT thumbnail */}
      <Skeleton className="h-12 w-12 flex-shrink-0" variant="rectangular" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* Price */}
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/**
 * Profile Header Skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <Skeleton className="h-48 w-full md:h-64" variant="rectangular" />

      {/* Avatar and info */}
      <div className="container-custom">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end">
          <Skeleton
            className="-mt-16 h-32 w-32 border-4 border-white dark:border-neutral-900"
            variant="circular"
          />

          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <Skeleton className="h-10 w-32" variant="rectangular" />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Grid of skeletons - useful for loading grids
 */
export function SkeletonGrid({
  count = 8,
  Component = NFTCardSkeleton,
  className
}: {
  count?: number;
  Component?: React.ComponentType;
  className?: string;
}) {
  return (
    <div className={cn('nft-grid', className)}>
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
