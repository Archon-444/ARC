/**
 * LiveActivityFeed Component
 *
 * Real-time activity feed showing:
 * - Sales, listings, offers, transfers, mints
 * - Live connection indicator
 * - Smooth animations
 * - Auto-scroll to top on new activity
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeActivity } from '@/lib/websocket';
import { Badge } from '@/components/ui/Badge';
import { formatUSDC, formatTimeAgo } from '@/lib/utils';
import { Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { listItemVariants } from '@/lib/animations';

export function LiveActivityFeed() {
  const { activities, isConnected } = useRealtimeActivity();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'listing':
        return '🏷️';
      case 'offer':
        return '🤝';
      case 'transfer':
        return '↔️';
      case 'mint':
        return '✨';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string): 'success' | 'primary' | 'warning' | 'neutral' => {
    switch (type) {
      case 'sale':
        return 'success';
      case 'listing':
        return 'primary';
      case 'offer':
        return 'warning';
      case 'transfer':
        return 'neutral';
      case 'mint':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            Live Activity
          </h3>
          {isConnected && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span className="text-xs text-success">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <Activity className="mx-auto mb-2 h-12 w-12 text-neutral-300" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isConnected ? 'Waiting for activity...' : 'Connecting...'}
              </p>
            </motion.div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={`${activity.nft.id}-${activity.timestamp}-${index}`}
                variants={listItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="group relative"
              >
                <Link
                  href={`/nft/${activity.nft.collection}/${activity.nft.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 transition-all hover:bg-neutral-50 hover:shadow-md dark:hover:bg-neutral-900"
                >
                  {/* NFT Image */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={activity.nft.image}
                      alt={activity.nft.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                      sizes="48px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getEventColor(activity.type)} size="sm">
                        {getEventIcon(activity.type)} {activity.type}
                      </Badge>
                      {activity.price && (
                        <span className="font-semibold text-primary-500 text-sm">
                          {formatUSDC(BigInt(activity.price))}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {activity.nft.name}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {activity.nft.collection}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* View All */}
      {activities.length > 0 && (
        <Link
          href="/activity"
          className="mt-4 block w-full rounded-lg border border-[var(--color-border)] py-2 text-center text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/10"
        >
          View All Activity
        </Link>
      )}
    </div>
  );
}
