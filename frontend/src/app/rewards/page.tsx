'use client';

import { useState } from 'react';
import { Trophy, Star, Gift, Zap, Award, Target, Crown, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { BADGES, XP_REWARDS, LEVEL_THRESHOLDS, getLevelTier, type BadgeId } from '@/lib/gamification';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'badges' | 'quests' | 'leaderboard';

// Mock user data - in production this would come from API/hook
const mockUserData = {
  level: 7,
  xp: 2450,
  xpToNextLevel: 750,
  progress: 52,
  rank: 1247,
  tier: 'Silver',
  badges: ['first_purchase', 'early_adopter', 'collector'] as BadgeId[],
};

const QUESTS = [
  { id: 1, title: 'Make Your First Purchase', xp: 50, completed: true, icon: Gift },
  { id: 2, title: 'List 5 NFTs', xp: 50, progress: 3, total: 5, completed: false, icon: Target },
  { id: 3, title: 'Win an Auction', xp: 30, completed: false, icon: Crown },
  { id: 4, title: 'Make 10 Offers', xp: 50, progress: 7, total: 10, completed: false, icon: Zap },
  { id: 5, title: 'Complete Daily Login Streak (7 days)', xp: 100, progress: 4, total: 7, completed: false, icon: Star },
];

const LEADERBOARD = [
  { rank: 1, address: '0x1234...5678', xp: 25000, level: 18, badge: 'whale' },
  { rank: 2, address: '0xabcd...efgh', xp: 22500, level: 17, badge: 'auction_king' },
  { rank: 3, address: '0x9876...5432', xp: 20100, level: 16, badge: 'trader' },
  { rank: 4, address: '0xfedc...ba98', xp: 18750, level: 15, badge: 'collector' },
  { rank: 5, address: '0x5555...6666', xp: 17200, level: 14, badge: 'offer_master' },
];

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const tier = getLevelTier(mockUserData.level);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header with Level Display */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white",
          tier.gradient
        )}>
          <div className="relative z-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider opacity-80">Your Rewards</p>
                <h1 className="mt-1 text-4xl font-bold">Level {mockUserData.level}</h1>
                <p className="mt-1 text-lg opacity-90">{tier.name} Tier</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{mockUserData.xp.toLocaleString()}</p>
                  <p className="text-sm opacity-80">Total XP</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">#{mockUserData.rank.toLocaleString()}</p>
                  <p className="text-sm opacity-80">Global Rank</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span>Level {mockUserData.level}</span>
                <span>{mockUserData.xpToNextLevel} XP to Level {mockUserData.level + 1}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${mockUserData.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <Trophy className="absolute -right-4 -top-4 h-48 w-48 opacity-10" />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
          {([
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'quests', label: 'Quests', icon: Target },
            { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* XP Rewards Info */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">How to Earn XP</h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(XP_REWARDS).map(([action, xp]) => (
                    <div
                      key={action}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800"
                    >
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                        +{xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Tiers */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Level Tiers</h3>
                <div className="mt-4 space-y-3">
                  {[
                    { name: 'Common', levels: '1-4', gradient: 'from-neutral-400 to-neutral-500' },
                    { name: 'Rare', levels: '5-9', gradient: 'from-blue-400 to-cyan-500' },
                    { name: 'Epic', levels: '10-14', gradient: 'from-purple-400 to-pink-500' },
                    { name: 'Legendary', levels: '15+', gradient: 'from-yellow-400 to-orange-500' },
                  ].map((tierInfo) => (
                    <div
                      key={tierInfo.name}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-3",
                        mockUserData.level >= parseInt(tierInfo.levels) || tierInfo.name === tier.name
                          ? `bg-gradient-to-r ${tierInfo.gradient} text-white`
                          : 'bg-neutral-50 dark:bg-neutral-800'
                      )}
                    >
                      <span className="font-medium">{tierInfo.name}</span>
                      <span className="text-sm opacity-80">Level {tierInfo.levels}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Badges */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Your Badges</h3>
                  <button
                    onClick={() => setActiveTab('badges')}
                    className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {mockUserData.badges.map((badgeId) => {
                    const badge = BADGES[badgeId];
                    return (
                      <div
                        key={badgeId}
                        className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{badge.name}</p>
                          <p className="text-xs text-neutral-500">{badge.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(BADGES).map((badge) => {
                const isUnlocked = mockUserData.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "relative rounded-xl border p-5 transition-all",
                      isUnlocked
                        ? 'border-primary-200 bg-white dark:border-primary-800 dark:bg-neutral-900'
                        : 'border-neutral-200 bg-neutral-50 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/50'
                    )}
                  >
                    {!isUnlocked && (
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl text-3xl",
                        isUnlocked
                          ? 'bg-primary-100 dark:bg-primary-500/20'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      )}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{badge.name}</h4>
                        <p className="mt-1 text-sm text-neutral-500">{badge.description}</p>
                        {isUnlocked && (
                          <p className="mt-2 text-xs font-medium text-green-500">Unlocked</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              {QUESTS.map((quest) => (
                <div
                  key={quest.id}
                  className={cn(
                    "rounded-xl border p-5",
                    quest.completed
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        quest.completed
                          ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      )}>
                        <quest.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{quest.title}</h4>
                        {quest.progress !== undefined && !quest.completed && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                <div
                                  className="h-full rounded-full bg-primary-500"
                                  style={{ width: `${(quest.progress / quest.total!) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-neutral-500">{quest.progress}/{quest.total}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        quest.completed
                          ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                      )}>
                        {quest.completed ? 'Completed' : `+${quest.xp} XP`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Top Players</h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {LEADERBOARD.map((player) => {
                  const playerTier = getLevelTier(player.level);
                  const badge = BADGES[player.badge as BadgeId];
                  return (
                    <div
                      key={player.rank}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                          player.rank === 1
                            ? 'bg-yellow-100 text-yellow-600'
                            : player.rank === 2
                              ? 'bg-neutral-200 text-neutral-600'
                              : player.rank === 3
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        )}>
                          {player.rank}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{player.address}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-medium", playerTier.color)}>
                              Level {player.level}
                            </span>
                            <span className="text-xs">{badge?.icon}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {player.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current User Position */}
              <div className="border-t-2 border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                      {mockUserData.rank}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">You</p>
                      <span className={cn("text-xs font-medium", tier.color)}>
                        Level {mockUserData.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {mockUserData.xp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
