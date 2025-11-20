/**
 * Collection Header Component
 *
 * Comprehensive collection page header with stats, social links, and actions
 * Includes banner, avatar, description, and follow functionality
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Check,
  Globe,
  Twitter,
  MessageCircle,
  ExternalLink,
  Share2,
  MoreHorizontal,
  Bell,
  BellOff,
  TrendingUp,
  Users,
  Package,
  Activity,
  Award,
} from 'lucide-react';
import { fadeInUpVariants, scaleInVariants } from '@/lib/animations';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useToast } from '@/hooks/useToast';
import type { Address } from '@/types';

export interface CollectionStats {
  floorPrice: number;
  totalVolume: number;
  items: number;
  owners: number;
  listedPercent: number;
  royalty?: number;
}

export interface CollectionSocials {
  website?: string;
  twitter?: string;
  discord?: string;
}

interface CollectionHeaderProps {
  collectionAddress: Address;
  name: string;
  description?: string;
  verified?: boolean;
  bannerImage?: string;
  avatarImage?: string;
  stats: CollectionStats;
  socials?: CollectionSocials;
  isFollowing?: boolean;
  onFollow?: (following: boolean) => void;
  className?: string;
}

export function CollectionHeader({
  collectionAddress,
  name,
  description,
  verified = false,
  bannerImage,
  avatarImage,
  stats,
  socials = {},
  isFollowing = false,
  onFollow,
  className = '',
}: CollectionHeaderProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [showMenu, setShowMenu] = useState(false);
  const { success, info } = useToast();

  // Handle follow/unfollow
  const handleFollow = () => {
    const newFollowingState = !following;
    setFollowing(newFollowingState);
    onFollow?.(newFollowingState);

    if (newFollowingState) {
      success('Following collection', 'You will receive notifications for new listings');
    } else {
      info('Unfollowed collection', 'You will no longer receive notifications');
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/collection/${collectionAddress}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || `Check out ${name} on Arc Marketplace`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url);
      success('Link copied', 'Collection link copied to clipboard');
    }
  };

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="initial"
      animate="animate"
      className={`relative ${className}`}
    >
      {/* Banner */}
      <div className="relative h-64 lg:h-80 bg-gradient-to-br from-purple-900/50 to-blue-900/50 overflow-hidden">
        {bannerImage ? (
          <Image
            src={bannerImage}
            alt={`${name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Avatar */}
          <motion.div
            variants={scaleInVariants}
            className="flex-shrink-0"
          >
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden border-4 border-gray-900 bg-gray-800 shadow-xl">
              {avatarImage ? (
                <Image
                  src={avatarImage}
                  alt={name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                  <Package className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white truncate">
                    {name}
                  </h1>
                  {verified && (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Contract Address */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-mono">
                    {collectionAddress.slice(0, 6)}...{collectionAddress.slice(-4)}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(collectionAddress);
                      success('Copied', 'Contract address copied to clipboard');
                    }}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    following
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {following ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  <span>{following ? 'Following' : 'Follow'}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all"
                  title="Share collection"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {/* More Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all"
                    title="More options"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 p-2"
                    >
                      <a
                        href={`https://etherscan.io/address/${collectionAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View on Etherscan</span>
                      </a>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-gray-300 mb-6 max-w-3xl line-clamp-3">{description}</p>
            )}

            {/* Social Links */}
            {(socials.website || socials.twitter || socials.discord) && (
              <div className="flex items-center gap-3 mb-6">
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Website</span>
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                )}
                {socials.discord && (
                  <a
                    href={socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Discord</span>
                  </a>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Floor Price */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400 uppercase">Floor Price</span>
                </div>
                <div className="text-xl font-bold text-white">
                  <AnimatedCounter value={stats.floorPrice} decimals={2} suffix=" ETH" />
                </div>
              </div>

              {/* Total Volume */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400 uppercase">Total Volume</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(stats.totalVolume)} ETH
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400 uppercase">Items</span>
                </div>
                <div className="text-xl font-bold text-white">
                  <AnimatedCounter value={stats.items} decimals={0} />
                </div>
              </div>

              {/* Owners */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400 uppercase">Owners</span>
                </div>
                <div className="text-xl font-bold text-white">
                  <AnimatedCounter value={stats.owners} decimals={0} />
                </div>
              </div>

              {/* Listed */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400 uppercase">Listed</span>
                </div>
                <div className="text-xl font-bold text-white">
                  <AnimatedCounter value={stats.listedPercent} decimals={1} suffix="%" />
                </div>
              </div>
            </div>

            {/* Royalty Info */}
            {stats.royalty !== undefined && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                <Award className="w-4 h-4" />
                <span>Creator royalty: {stats.royalty}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
