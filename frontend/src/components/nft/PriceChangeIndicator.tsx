'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface PriceChangeIndicatorProps {
  change: number;
  changePercent: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const ICON_SIZE = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function PriceChangeIndicator({
  change,
  changePercent,
  showValue = true,
  size = 'md',
}: PriceChangeIndicatorProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div
      className={`inline-flex items-center gap-1 font-medium ${SIZE_CLASSES[size]} ${
        isNeutral
          ? 'text-neutral-500'
          : isPositive
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isNeutral ? (
        <Minus size={ICON_SIZE[size]} />
      ) : isPositive ? (
        <TrendingUp size={ICON_SIZE[size]} />
      ) : (
        <TrendingDown size={ICON_SIZE[size]} />
      )}

      {showValue ? (
        <span>
          {isPositive ? '+' : ''}
          {changePercent.toFixed(1)}%
        </span>
      ) : null}
    </div>
  );
}
