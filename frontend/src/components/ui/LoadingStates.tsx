/**
 * LoadingStates Component
 *
 * Various loading indicators and skeleton screens:
 * - SpinnerLoader - Classic spinning loader
 * - DotsLoader - Animated dots
 * - PulseLoader - Pulsing circle
 * - BarLoader - Progress bar
 * - SkeletonGrid - NFT card grid skeletons
 */

'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { shimmerVariants } from '@/lib/animations';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SpinnerLoader({ size = 'md', className }: LoaderProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-primary-500`} />
    </div>
  );
}

export function DotsLoader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className || ''}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function PulseLoader({ size = 'md', className }: LoaderProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <motion.div
        className={`${sizes[size]} rounded-full bg-primary-500`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export function BarLoader({ className }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700 ${className || ''}`}>
      <motion.div
        className="h-2 bg-gradient-to-r from-primary-500 to-accent-500"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ width: '50%' }}
      />
    </div>
  );
}

/**
 * Enhanced Skeleton Component with shimmer animation
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles =
    'bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    backgroundSize: '1000px 100%',
  };

  return animate ? (
    <motion.div
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      style={style}
    />
  ) : (
    <div
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      style={style}
    />
  );
}

/**
 * NFT Card Skeleton
 */
export function NFTCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-3 p-4">
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={20} />
        <div className="flex justify-between">
          <Skeleton width="30%" height={24} />
          <Skeleton width="25%" height={32} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Collection Card Skeleton
 */
export function CollectionCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <Skeleton className="aspect-[2/1] w-full" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={18} />
            <Skeleton width="50%" height={14} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Activity Row Skeleton
 */
export function ActivityRowSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height={16} />
        <Skeleton width="60%" height={14} />
      </div>
      <Skeleton width="15%" height={12} />
    </motion.div>
  );
}

/**
 * Grid of Skeleton Cards
 */
interface SkeletonGridProps {
  count?: number;
  type?: 'nft' | 'collection' | 'activity';
  className?: string;
}

export function SkeletonGrid({ count = 8, type = 'nft', className }: SkeletonGridProps) {
  const SkeletonComponent = {
    nft: NFTCardSkeleton,
    collection: CollectionCardSkeleton,
    activity: ActivityRowSkeleton,
  }[type];

  const gridClass = type === 'activity' ? 'space-y-3' : 'nft-grid';

  return (
    <div className={`${gridClass} ${className || ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

/**
 * Page Loading Overlay
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-black/80">
      <div className="text-center">
        <SpinnerLoader size="lg" />
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Button Loading State
 */
interface ButtonLoaderProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function ButtonLoader({ children, isLoading }: ButtonLoaderProps) {
  return (
    <>
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </>
  );
}
