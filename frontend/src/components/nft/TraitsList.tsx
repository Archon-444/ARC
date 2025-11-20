/**
 * Traits List Component
 *
 * Displays NFT traits with rarity levels and statistics
 * Supports expandable interface for large trait sets
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, Award, Star } from 'lucide-react';
import { fadeInUpVariants, listItemVariants, staggerContainer } from '@/lib/animations';

export interface Trait {
  trait_type: string;
  value: string;
  rarity?: number; // Percentage (0-100)
  trait_count?: number; // How many NFTs have this trait
  floor_price?: number; // Floor price for NFTs with this trait
}

interface TraitsListProps {
  traits: Trait[];
  collectionSize?: number;
  className?: string;
  initialExpanded?: boolean;
  maxInitialDisplay?: number;
}

type RarityLevel = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

export function TraitsList({
  traits,
  collectionSize = 10000,
  className = '',
  initialExpanded = false,
  maxInitialDisplay = 6,
}: TraitsListProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Calculate rarity level based on percentage
  const getRarityLevel = (rarity: number): RarityLevel => {
    if (rarity <= 1) return 'legendary';
    if (rarity <= 5) return 'epic';
    if (rarity <= 15) return 'rare';
    if (rarity <= 35) return 'uncommon';
    return 'common';
  };

  // Get rarity color and styling
  const getRarityStyles = (level: RarityLevel) => {
    const styles = {
      legendary: {
        bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        icon: '👑',
      },
      epic: {
        bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        icon: '💎',
      },
      rare: {
        bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        icon: '⭐',
      },
      uncommon: {
        bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
        icon: '✨',
      },
      common: {
        bg: 'bg-gray-700/30',
        border: 'border-gray-600/50',
        text: 'text-gray-400',
        icon: '⚪',
      },
    };
    return styles[level];
  };

  // Calculate rarity score
  const rarityScore = useMemo(() => {
    if (traits.length === 0) return 0;

    const traitsWithRarity = traits.filter((t) => t.rarity !== undefined);
    if (traitsWithRarity.length === 0) return 0;

    const totalRarity = traitsWithRarity.reduce((sum, t) => sum + (100 - (t.rarity || 0)), 0);
    return Math.round(totalRarity / traitsWithRarity.length);
  }, [traits]);

  // Sort traits by rarity (rarest first)
  const sortedTraits = useMemo(() => {
    return [...traits].sort((a, b) => {
      const rarityA = a.rarity || 100;
      const rarityB = b.rarity || 100;
      return rarityA - rarityB;
    });
  }, [traits]);

  const displayedTraits = isExpanded
    ? sortedTraits
    : sortedTraits.slice(0, maxInitialDisplay);
  const hasMore = sortedTraits.length > maxInitialDisplay;

  // Calculate trait count percentage
  const getTraitPercentage = (trait: Trait): number => {
    if (trait.rarity !== undefined) return trait.rarity;
    if (trait.trait_count && collectionSize) {
      return (trait.trait_count / collectionSize) * 100;
    }
    return 0;
  };

  if (traits.length === 0) {
    return (
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
        className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 ${className}`}
      >
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Sparkles className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">No traits available</p>
          <p className="text-sm">Trait information will appear here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="initial"
      animate="animate"
      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Traits</h3>
          <p className="text-sm text-gray-400">{traits.length} properties</p>
        </div>

        {/* Rarity Score */}
        {rarityScore > 0 && (
          <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-2">
            <Award className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Rarity Score</p>
              <p className="text-lg font-bold text-purple-400">{rarityScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* Traits Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {displayedTraits.map((trait, index) => {
            const percentage = getTraitPercentage(trait);
            const rarityLevel = getRarityLevel(percentage);
            const styles = getRarityStyles(rarityLevel);

            return (
              <motion.div
                key={`${trait.trait_type}-${trait.value}`}
                variants={listItemVariants}
                layout
                className={`${styles.bg} ${styles.border} border rounded-lg p-4 transition-all hover:scale-105`}
              >
                {/* Trait Type */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    {trait.trait_type}
                  </span>
                  <span className="text-lg">{styles.icon}</span>
                </div>

                {/* Trait Value */}
                <p className="text-white font-semibold mb-3 truncate" title={trait.value}>
                  {trait.value}
                </p>

                {/* Rarity Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${styles.text} font-medium`}>
                      {percentage.toFixed(2)}% have this trait
                    </span>
                    <span className={`text-xs ${styles.text} uppercase font-bold`}>
                      {rarityLevel}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={`h-full ${
                        rarityLevel === 'legendary'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : rarityLevel === 'epic'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : rarityLevel === 'rare'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          : rarityLevel === 'uncommon'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  {trait.trait_count && (
                    <span>{trait.trait_count.toLocaleString()} items</span>
                  )}
                  {trait.floor_price && (
                    <span className="text-purple-400 font-medium">
                      Floor: {trait.floor_price.toFixed(2)} ETH
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Expand/Collapse Button */}
      {hasMore && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show All {sortedTraits.length} Traits</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </motion.button>
      )}

      {/* Rarity Legend */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">
          Rarity Levels
        </p>
        <div className="flex flex-wrap gap-3">
          {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as RarityLevel[]).map(
            (level) => {
              const styles = getRarityStyles(level);
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-sm">{styles.icon}</span>
                  <span className={`text-xs ${styles.text} font-medium capitalize`}>
                    {level}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </motion.div>
  );
}
