'use client';

import { RarityBadge } from '@/components/nft/RarityBadge';

interface AttributeCardProps {
  traitType: string;
  value: string;
  frequency?: number;
  showRarity?: boolean;
}

function getRarityTier(freq: number) {
  if (freq <= 1) return 'legendary';
  if (freq <= 5) return 'epic';
  if (freq <= 15) return 'rare';
  if (freq <= 40) return 'uncommon';
  return 'common';
}

export function AttributeCard({
  traitType,
  value,
  frequency,
  showRarity = true,
}: AttributeCardProps) {
  const rarityTier = frequency !== undefined ? getRarityTier(frequency) : 'common';

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase text-neutral-600 dark:text-neutral-400">
          {traitType}
        </div>
        {showRarity && frequency !== undefined && frequency < 15 ? (
          <RarityBadge rarityTier={rarityTier} size="sm" />
        ) : null}
      </div>
      <div className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
      {frequency !== undefined ? (
        <div className="text-xs text-neutral-500">{frequency.toFixed(1)}% have this trait</div>
      ) : null}
    </div>
  );
}
