'use client';

import { useState } from 'react';
import { Trophy, Star, Gift, Zap, Award, Target, Crown, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { BADGES, XP_REWARDS, getLevelTier, type BadgeId } from '@/lib/gamification';
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header with Level Display */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white shadow-lg",
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
                  className="h-full rounded-full bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${mockUserData.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <Trophy className="absolute -right-4 -top-4 h-48 w-48 opacity-10" />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-gray-200/50 dark:border-white/10">
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
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
              <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How to Earn XP</h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(XP_REWARDS).map(([action, xp]) => (
                    <div
                      key={action}
                      className="flex items-center justify-between rounded-lg bg-gray-50/50 p-3 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="rounded-full bg-primary-100/80 px-2.5 py-0.5 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        +{xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Tiers */}
              <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Level Tiers</h3>
                <div className="mt-4 space-y-3">
                  {[
                    { name: 'Common', levels: '1-4', gradient: 'from-gray-400 to-gray-500' },
                    { name: 'Rare', levels: '5-9', gradient: 'from-blue-400 to-cyan-500' },
                    { name: 'Epic', levels: '10-14', gradient: 'from-purple-400 to-pink-500' },
                    { name: 'Legendary', levels: '15+', gradient: 'from-yellow-400 to-orange-500' },
                  ].map((tierInfo) => (
                    <div
                      key={tierInfo.name}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-3 border",
                        mockUserData.level >= parseInt(tierInfo.levels) || tierInfo.name === tier.name
                          ? `bg-gradient-to-r ${tierInfo.gradient} text-white border-transparent`
                          : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      <span className="font-medium">{tierInfo.name}</span>
                      <span className="text-sm opacity-80">Level {tierInfo.levels}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Badges */}
              <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Badges</h3>
                  <button
                    onClick={() => setActiveTab('badges')}
                    className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
                        className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3 dark:bg-gray-800/80 border border-gray-100 dark:border-white/5 hover:scale-105 transition-transform"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{badge.name}</p>
                          <p className="text-xs text-gray-500">{badge.description}</p>
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
                      "relative rounded-xl border p-5 transition-all backdrop-blur-md",
                      isUnlocked
                        ? 'border-primary-200 bg-white/60 dark:border-primary-900/50 dark:bg-slate-900/50 shadow-sm hover:shadow-md'
                        : 'border-gray-200/50 bg-white/30 dark:border-white/5 dark:bg-slate-900/30 opacity-70 grayscale-[30%]'
                    )}
                  >
                    {!isUnlocked && (
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl text-3xl",
                        isUnlocked
                          ? 'bg-primary-100/80 dark:bg-primary-900/30'
                          : 'bg-gray-100/80 dark:bg-gray-800/50'
                      )}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className={cn("font-semibold", isUnlocked ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>
                          {badge.name}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
                        {isUnlocked && (
                          <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">Unlocked</p>
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
                    "rounded-xl border p-5 backdrop-blur-md transition-all hover:shadow-md",
                    quest.completed
                      ? 'border-green-200/60 bg-green-50/60 dark:border-green-900/30 dark:bg-green-900/10'
                      : 'border-gray-200/60 bg-white/60 dark:border-white/10 dark:bg-slate-900/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        quest.completed
                          ? 'bg-green-100/80 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400'
                      )}>
                        <quest.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{quest.title}</h4>
                        {quest.progress !== undefined && !quest.completed && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700/80">
                                <div
                                  className="h-full rounded-full bg-primary-500"
                                  style={{ width: `${(quest.progress / quest.total!) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{quest.progress}/{quest.total}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold border",
                        quest.completed
                          ? 'bg-green-100/80 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                          : 'bg-primary-50/80 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/30'
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
            <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden">
              <div className="border-b border-gray-200/50 p-4 dark:border-white/5 bg-gray-50/30 dark:bg-slate-800/30">
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Players</h3>
              </div>
              <div className="divide-y divide-gray-100/50 dark:divide-white/5">
                {LEADERBOARD.map((player) => {
                  const playerTier = getLevelTier(player.level);
                  const badge = BADGES[player.badge as BadgeId];
                  return (
                    <div
                      key={player.rank}
                      className="flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                          player.rank === 1
                            ? 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500'
                            : player.rank === 2
                              ? 'bg-gray-200/80 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
                              : player.rank === 3
                                ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500'
                                : 'bg-gray-100/50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400'
                        )}>
                          {player.rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{player.address}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-medium", playerTier.color)}>
                              Level {player.level}
                            </span>
                            <span className="text-xs">{badge?.icon}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current User Position */}
              <div className="border-t border-primary-200/50 bg-primary-50/50 p-4 dark:border-primary-900/30 dark:bg-primary-900/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100/80 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {mockUserData.rank}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">You</p>
                      <span className={cn("text-xs font-medium", tier.color)}>
                        Level {mockUserData.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
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