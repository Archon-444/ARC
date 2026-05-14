/**
 * XPDisplay Component
 *
 * Compact XP/level indicator for navbar with progress bar
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserXP } from '@/hooks/useUserXP';
import { getLevelTier, BADGES } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { useClickAway } from 'react-use';

interface XPDisplayProps {
    address?: string;
}

export function XPDisplay({ address }: XPDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading } = useUserXP(address);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickAway(dropdownRef, () => setIsOpen(false));

    if (!address || isLoading || !data) {
        return null;
    }

    const tier = getLevelTier(data.level);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50 px-3 py-1.5 transition-all hover:shadow-md dark:from-neutral-800 dark:to-neutral-900"
            >
                {/* Level Badge */}
                <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br font-bold text-xs text-white shadow-sm",
                    `bg-gradient-to-br ${tier.gradient}`
                )}>
                    {data.level}
                </div>

                {/* XP Info */}
                <div className="hidden sm:flex flex-col items-start">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        Level {data.level}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {data.xp.toLocaleString()} XP
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="hidden md:block">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <motion.div
                            className={cn("h-full bg-gradient-to-r", tier.gradient)}
                            initial={{ width: 0 }}
                            animate={{ width: `${data.progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 z-50"
                    >
                        {/* Header */}
                        <div className={cn(
                            "rounded-t-xl bg-gradient-to-r p-4 text-white",
                            tier.gradient
                        )}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold">Level {data.level}</div>
                                    <div className="text-sm opacity-90">{tier.name}</div>
                                </div>
                                <Trophy className="h-8 w-8 opacity-80" />
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span>{data.xp.toLocaleString()} XP</span>
                                    <span>{data.xpToNextLevel.toLocaleString()} to next</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.progress}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Global Rank</span>
                                </div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    #{data.rank?.toLocaleString() || 'N/A'}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <Award className="h-4 w-4" />
                                    <span>Badges Earned</span>
                                </div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {data.badges.length}/{Object.keys(BADGES).length}
                                </div>
                            </div>

                            {/* Badges Preview */}
                            {data.badges.length > 0 && (
                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                                        Recent Badges
                                    </div>
                                    <div className="flex gap-2">
                                        {data.badges.slice(0, 5).map((badgeId) => {
                                            const badge = BADGES[badgeId];
                                            return (
                                                <div
                                                    key={badgeId}
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-xl dark:bg-neutral-800"
                                                    title={badge.name}
                                                >
                                                    {badge.icon}
                                                </div>
                                            );
                                        })}
                                        {data.badges.length > 5 && (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-xs font-medium text-neutral-500 dark:bg-neutral-800">
                                                +{data.badges.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
