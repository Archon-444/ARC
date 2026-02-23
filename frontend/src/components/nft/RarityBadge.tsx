'use client';

type RarityBadgeProps = {
  rarityTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rarityRank?: number;
  rarityPercentile?: number;
  showRank?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const RARITY_CONFIG = {
  legendary: {
    label: 'Legendary',
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    textColor: 'text-white',
    icon: '👑',
  },
  epic: {
    label: 'Epic',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-white',
    icon: '💎',
  },
  rare: {
    label: 'Rare',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textColor: 'text-white',
    icon: '✨',
  },
  uncommon: {
    label: 'Uncommon',
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    textColor: 'text-white',
    icon: '🌟',
  },
  common: {
    label: 'Common',
    color: 'bg-neutral-200 dark:bg-neutral-700',
    textColor: 'text-neutral-700 dark:text-neutral-300',
    icon: '⚪',
  },
};

const SIZE_CLASSES = {
  sm: 'text-[10px] px-2 py-1',
  md: 'text-xs px-2.5 py-1.5',
  lg: 'text-sm px-3 py-2',
};

export function RarityBadge({
  rarityTier,
  rarityRank,
  rarityPercentile,
  showRank = false,
  size = 'md',
}: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarityTier];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full ${config.color} ${config.textColor} ${SIZE_CLASSES[size]} font-semibold`}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>

      {showRank && rarityRank ? (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">#{rarityRank}</span>
      ) : null}

      {rarityPercentile !== undefined ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-500">
          Top {rarityPercentile.toFixed(1)}%
        </span>
      ) : null}
    </div>
  );
}
