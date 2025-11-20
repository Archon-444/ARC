/**
 * PropertyBadge Component
 *
 * Displays NFT trait/property with rarity information
 * Used on NFT detail pages and collection filters
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PropertyBadgeProps {
  traitType: string;
  value: string;
  rarity?: number; // percentage (0-100)
  count?: number; // how many NFTs have this trait
  total?: number; // total NFTs in collection
  onClick?: () => void;
  className?: string;
}

export function PropertyBadge({
  traitType,
  value,
  rarity,
  count,
  total,
  onClick,
  className,
}: PropertyBadgeProps) {
  const isClickable = !!onClick;
  const rarityColor = rarity
    ? rarity < 5
      ? 'border-purple-500/30 bg-purple-50 dark:bg-purple-950/30'
      : rarity < 20
      ? 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/30'
      : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50'
    : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50';

  const Component = isClickable ? motion.button : motion.div;

  return (
    <Component
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-lg border p-3 transition-all',
        rarityColor,
        isClickable && 'cursor-pointer hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {traitType}
        </span>
        {rarity !== undefined && (
          <span
            className={cn(
              'text-xs font-semibold',
              rarity < 5
                ? 'text-purple-600 dark:text-purple-400'
                : rarity < 20
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {rarity.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
          {value}
        </span>
        {count !== undefined && total !== undefined && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {count} / {total}
          </span>
        )}
      </div>
    </Component>
  );
}

/**
 * Grid of property badges
 */
export interface PropertyGridProps {
  properties: Array<{
    traitType: string;
    value: string;
    rarity?: number;
    count?: number;
  }>;
  total?: number;
  onPropertyClick?: (traitType: string, value: string) => void;
  className?: string;
}

export function PropertyGrid({
  properties,
  total,
  onPropertyClick,
  className,
}: PropertyGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      {properties.map((prop) => (
        <PropertyBadge
          key={`${prop.traitType}-${prop.value}`}
          traitType={prop.traitType}
          value={prop.value}
          rarity={prop.rarity}
          count={prop.count}
          total={total}
          onClick={
            onPropertyClick
              ? () => onPropertyClick(prop.traitType, prop.value)
              : undefined
          }
        />
      ))}
    </div>
  );
}
