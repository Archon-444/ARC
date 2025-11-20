/**
 * CollectionHero Component
 *
 * Hero section for collection pages with banner, avatar, stats, and actions
 * Follows OpenSea's collection page design pattern
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  ExternalLink,
  Globe,
  Heart,
  Share2,
  MoreHorizontal,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn, formatUSDC, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface CollectionStats {
  totalSupply: number;
  uniqueOwners: number;
  floorPrice: bigint;
  totalVolume: bigint;
  volumeChange24h?: number; // percentage
}

export interface CollectionSocials {
  website?: string;
  twitter?: string;
  discord?: string;
}

export interface CollectionHeroProps {
  name: string;
  description: string;
  creator: string;
  creatorAddress: string;
  bannerImage?: string;
  avatarImage?: string;
  verified?: boolean;
  stats: CollectionStats;
  socials?: CollectionSocials;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export function CollectionHero({
  name,
  description,
  creator,
  creatorAddress,
  bannerImage,
  avatarImage,
  verified = false,
  stats,
  socials,
  className,
}: CollectionHeroProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const truncatedDescription =
    description.length > 200 ? description.slice(0, 200) + '...' : description;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Banner Image */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 dark:from-primary-900/20 dark:via-primary-800/20 dark:to-primary-700/20 md:h-80 lg:h-96">
        {bannerImage ? (
          <Image
            src={bannerImage}
            alt={`${name} banner`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Collection Info */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* Avatar - Overlapping banner */}
        <motion.div variants={itemVariants} className="relative -mt-16 mb-4">
          <div className="relative inline-block">
            <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-800">
              {avatarImage ? (
                <Image
                  src={avatarImage}
                  alt={name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                  <span className="text-4xl font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {verified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 ring-4 ring-white dark:ring-neutral-900"
              >
                <Check className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Title and Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <motion.div variants={itemVariants} className="flex-1">
            <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl lg:text-5xl">
              {name}
            </h1>
            <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
              Created by{' '}
              <Link
                href={`/profile/${creatorAddress}`}
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {creator}
              </Link>
            </p>

            {/* Description */}
            <div className="max-w-3xl">
              <p className="text-base text-neutral-700 dark:text-neutral-300">
                {showFullDescription ? description : truncatedDescription}
              </p>
              {description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Social Links */}
            {socials && (
              <div className="mt-4 flex items-center gap-3">
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400"
                    aria-label="Website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={`https://twitter.com/${socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socials.discord && (
                  <a
                    href={socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400"
                    aria-label="Discord"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={`https://arcscan.com/collection/${creatorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400"
                  aria-label="View on Explorer"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <Button
              variant={isFavorited ? 'primary' : 'outline'}
              leftIcon={<Heart className={cn('h-4 w-4', isFavorited && 'fill-current')} />}
              onClick={() => setIsFavorited(!isFavorited)}
              aria-label={isFavorited ? 'Unfavorite collection' : 'Favorite collection'}
            >
              Favorite
            </Button>
            <Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={handleShare}>
              Share
            </Button>
            <Button variant="ghost" size="sm" aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50 md:grid-cols-4"
        >
          <StatCard label="Items" value={formatNumber(stats.totalSupply)} />
          <StatCard label="Owners" value={formatNumber(stats.uniqueOwners)} />
          <StatCard
            label="Floor Price"
            value={formatUSDC(stats.floorPrice)}
            showUSDC
          />
          <StatCard
            label="Total Volume"
            value={formatUSDC(stats.totalVolume)}
            change={stats.volumeChange24h}
            showUSDC
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  showUSDC?: boolean;
}

function StatCard({ label, value, change, showUSDC }: StatCardProps) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">
          {value}
        </span>
        {showUSDC && (
          <span className="text-sm font-medium text-neutral-500">USDC</span>
        )}
      </div>
      {change !== undefined && (
        <span
          className={cn(
            'mt-1 text-xs font-semibold',
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}
