'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Activity,
  Award,
  BarChart3,
  ChevronRight,
  Crown,
  Gift,
  Lock,
  Package,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import { formatUSDC } from '@/hooks/useMarketplace';
import { BADGES, XP_REWARDS, getLevelTier, type BadgeId } from '@/lib/gamification';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'badges' | 'quests' | 'leaderboard';

interface RewardSnapshot {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progress: number;
  rank: number;
  badges: BadgeId[];
  ownedCount: number;
  createdCount: number;
  listingsCount: number;
  purchaseCount: number;
  saleCount: number;
  totalSpent: bigint;
  totalEarned: bigint;
  totalActivity: number;
}

const PREVIEW_SNAPSHOT: RewardSnapshot = {
  level: 7,
  xp: 2450,
  xpToNextLevel: 750,
  progress: 52,
  rank: 1247,
  badges: ['first_purchase', 'early_adopter', 'collector'],
  ownedCount: 8,
  createdCount: 3,
  listingsCount: 3,
  purchaseCount: 5,
  saleCount: 2,
  totalSpent: 0n,
  totalEarned: 0n,
  totalActivity: 10,
};

const LEADERBOARD = [
  { rank: 1, address: '0x1234...5678', xp: 25000, level: 18, badge: 'whale' },
  { rank: 2, address: '0xabcd...efgh', xp: 22500, level: 17, badge: 'auction_king' },
  { rank: 3, address: '0x9876...5432', xp: 20100, level: 16, badge: 'trader' },
  { rank: 4, address: '0xfedc...ba98', xp: 18750, level: 15, badge: 'collector' },
  { rank: 5, address: '0x5555...6666', xp: 17200, level: 14, badge: 'offer_master' },
];

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
] as const;

function shortenAddress(address?: string | null) {
  if (!address) return 'No wallet connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function buildRewardSnapshot(user: any, isConnected: boolean): RewardSnapshot {
  if (!user) {
    return isConnected
      ? {
          level: 1,
          xp: 0,
          xpToNextLevel: 350,
          progress: 0,
          rank: 5000,
          badges: [],
          ownedCount: 0,
          createdCount: 0,
          listingsCount: 0,
          purchaseCount: 0,
          saleCount: 0,
          totalSpent: 0n,
          totalEarned: 0n,
          totalActivity: 0,
        }
      : PREVIEW_SNAPSHOT;
  }

  const ownedCount = (user.ownedNFTs || []).length;
  const createdCount = (user.createdNFTs || []).length;
  const listingsCount = (user.listings || []).length;
  const purchaseCount = (user.purchases || []).length;
  const saleCount = (user.sales || []).length;
  const totalSpent = BigInt(user.totalSpent || 0);
  const totalEarned = BigInt(user.totalEarned || 0);
  const totalActivity = purchaseCount + saleCount + listingsCount + createdCount;

  const badges: BadgeId[] = [];
  if (purchaseCount > 0) badges.push('first_purchase');
  if (createdCount > 0) badges.push('early_adopter');
  if (ownedCount >= 3 || createdCount >= 3) badges.push('collector');

  const xp =
    ownedCount * 40 +
    createdCount * 160 +
    listingsCount * 60 +
    purchaseCount * 90 +
    saleCount * 110;
  const levelFloor = xp > 0 ? Math.floor(xp / 350) : 0;
  const level = Math.max(1, levelFloor + 1);
  const cycleProgress = xp % 350;

  return {
    level,
    xp,
    xpToNextLevel: cycleProgress === 0 ? 350 : 350 - cycleProgress,
    progress: Math.round((cycleProgress / 350) * 100),
    rank: Math.max(1, 5000 - xp - totalActivity * 25),
    badges,
    ownedCount,
    createdCount,
    listingsCount,
    purchaseCount,
    saleCount,
    totalSpent,
    totalEarned,
    totalActivity,
  };
}

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    const loadRewardsUser = async () => {
      if (!address || !isConnected) {
        setUser(null);
        return;
      }

      setIsLoadingUser(true);
      try {
        const data: any = await fetchGraphQL(GET_USER, { id: address.toLowerCase() });
        setUser(data.user || null);
      } catch (error) {
        console.error('Error loading rewards user:', error);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadRewardsUser();
  }, [address, isConnected]);

  const snapshot = useMemo(() => buildRewardSnapshot(user, isConnected), [user, isConnected]);
  const tier = getLevelTier(snapshot.level);
  const netFlow = snapshot.totalEarned - snapshot.totalSpent;

  const quests = useMemo(
    () => [
      {
        id: 1,
        title: 'Complete your first purchase',
        xp: 50,
        completed: snapshot.purchaseCount > 0,
        progress: Math.min(snapshot.purchaseCount, 1),
        total: 1,
        icon: Gift,
      },
      {
        id: 2,
        title: 'Create 3 listings',
        xp: 60,
        completed: snapshot.listingsCount >= 3,
        progress: Math.min(snapshot.listingsCount, 3),
        total: 3,
        icon: Target,
      },
      {
        id: 3,
        title: 'Publish your first creation',
        xp: 75,
        completed: snapshot.createdCount > 0,
        progress: Math.min(snapshot.createdCount, 1),
        total: 1,
        icon: Sparkles,
      },
      {
        id: 4,
        title: 'Reach 5 total trades',
        xp: 100,
        completed: snapshot.purchaseCount + snapshot.saleCount >= 5,
        progress: Math.min(snapshot.purchaseCount + snapshot.saleCount, 5),
        total: 5,
        icon: Zap,
      },
      {
        id: 5,
        title: 'Hold 5 wallet assets',
        xp: 80,
        completed: snapshot.ownedCount >= 5,
        progress: Math.min(snapshot.ownedCount, 5),
        total: 5,
        icon: Star,
      },
    ],
    [snapshot]
  );

  const completedQuests = useMemo(() => quests.filter((quest) => quest.completed).length, [quests]);

  const shellRoutes = [
    {
      title: 'Open profile',
      description: 'Return to your wallet identity surface and review richer account-linked metrics.',
      href: address ? `/profile/${address}` : '/profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      title: 'Review stats',
      description: 'Use ARC analytics before routing back into creation, trading, and loyalty actions.',
      href: '/stats',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: 'Open studio',
      description: 'Move from loyalty progression into creator workflows and collection management.',
      href: '/studio',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      title: 'Launch a token',
      description: 'Connect progression with launchpad-native token creation routes.',
      href: '/launch',
      icon: <Rocket className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-8 grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
              ARC rewards
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Progress through loyalty, quests, and wallet-linked status in one ARC rewards surface.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Rewards now behaves more like the connected shell, using live wallet activity where available and keeping continuity into profile, studio, analytics, token markets, and launch routes.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
              >
                <Search className="h-4 w-4" />
                Explore markets
              </Link>
              <Link
                href="/explore?tab=tokens"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Wallet className="h-4 w-4" />
                Token markets
              </Link>
            </div>
          </div>

          <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-r p-6 text-white', tier.gradient)}>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Current status</div>
                  <div className="mt-2 text-4xl font-bold">Level {snapshot.level}</div>
                  <div className="mt-1 text-lg opacity-90">{tier.name} tier</div>
                </div>
                <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-wide opacity-75">Total XP</div>
                  <div className="mt-1 text-2xl font-bold">{snapshot.xp.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-wide opacity-75">Global rank</div>
                  <div className="mt-1 text-2xl font-bold">#{snapshot.rank.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span>Level {snapshot.level}</span>
                  <span>{snapshot.xpToNextLevel} XP to level {snapshot.level + 1}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${snapshot.progress}%` }} />
                </div>
              </div>
            </div>
            <Trophy className="absolute -right-5 -top-5 h-40 w-40 opacity-10" />
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  {isLoadingUser ? <Activity className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
                  Rewards state
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {isConnected ? 'Wallet-linked progression active' : 'Preview progression active'}
                </div>
                <p className="mt-1 max-w-3xl text-sm text-current">
                  {isConnected
                    ? `Rewards is using ${shortenAddress(address)} as the active shell identity and translating wallet activity into progression signals across quests, badges, and status.`
                    : 'This rewards surface stays visually aligned with the upgraded ARC shell and shows a preview-style progression layer until a wallet is connected.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </Link>
                <Link href="/studio" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                  <Sparkles className="h-4 w-4" />
                  Studio
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-wrap gap-2">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OverviewMetric label="Unlocked badges" value={snapshot.badges.length.toString()} hint="Live visible reward status" />
              <OverviewMetric label="Completed quests" value={completedQuests.toString()} hint="Wallet-linked progression tasks" />
              <OverviewMetric label="Activity signals" value={snapshot.totalActivity.toString()} hint="Creations, listings, buys, and sales" />
              <OverviewMetric label="Net flow" value={`${netFlow < 0n ? '-' : ''}${formatUSDC(netFlow < 0n ? -netFlow : netFlow)} USDC`} hint="Marketplace cash-flow signal" />
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Wallet-linked reward signals</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">This pass replaces more of the preview feeling with richer account-linked state pulled from the connected wallet profile.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SignalCard title="Owned assets" value={snapshot.ownedCount.toString()} description="Wallet-held inventory contributes to loyalty depth." />
                <SignalCard title="Created assets" value={snapshot.createdCount.toString()} description="Creator output now feeds progression state more directly." />
                <SignalCard title="Purchases" value={snapshot.purchaseCount.toString()} description="Marketplace participation maps into reward growth." />
                <SignalCard title="Sales" value={snapshot.saleCount.toString()} description="Sell-side activity now informs loyalty signals too." />
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Shell routes</h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Use rewards as a routing layer into the highest-value ARC behaviors.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {shellRoutes.map((route) => (
                  <ActionCard key={route.title} icon={route.icon} title={route.title} description={route.description} href={route.href} />
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">How XP is earned</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Progress should feel connected to real ARC participation, not bolted on.</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(XP_REWARDS).map(([action, xp]) => (
                    <div key={action} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-slate-950/60">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
                      </span>
                      <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                        +{xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Tier ladder</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">A clearer progression view that matches the upgraded shell styling.</p>
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
                        'flex items-center justify-between rounded-2xl p-4',
                        snapshot.level >= parseInt(tierInfo.levels) || tierInfo.name === tier.name
                          ? `bg-gradient-to-r ${tierInfo.gradient} text-white`
                          : 'border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60'
                      )}
                    >
                      <span className="font-medium">{tierInfo.name}</span>
                      <span className="text-sm opacity-80">Level {tierInfo.levels}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Recent badge unlocks</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">A quicker snapshot of earned status inside the ARC account layer.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('badges')}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
                  >
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(snapshot.badges.length > 0 ? snapshot.badges : PREVIEW_SNAPSHOT.badges).map((badgeId) => {
                    const badge = BADGES[badgeId];
                    return (
                      <div key={badgeId} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-slate-950/60">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{badge.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{badge.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(BADGES).map((badge) => {
              const isUnlocked = snapshot.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'relative rounded-3xl border p-5 shadow-sm transition-all',
                    isUnlocked
                      ? 'border-primary-200/60 bg-white/80 backdrop-blur dark:border-primary-800/40 dark:bg-slate-900/70'
                      : 'border-neutral-200/60 bg-white/50 opacity-70 backdrop-blur-sm dark:border-white/5 dark:bg-white/5'
                  )}
                >
                  {!isUnlocked && <Lock className="absolute right-4 top-4 h-4 w-4 text-neutral-400" />}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl text-3xl',
                      isUnlocked ? 'bg-primary-100 dark:bg-primary-500/20' : 'bg-neutral-200 dark:bg-neutral-800'
                    )}>
                      {badge.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{badge.name}</h3>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{badge.description}</p>
                      {isUnlocked && <p className="mt-2 text-xs font-medium text-green-500">Unlocked</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="space-y-4">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={cn(
                  'rounded-3xl border p-5 shadow-sm',
                  quest.completed
                    ? 'border-green-200/60 bg-green-50/70 backdrop-blur dark:border-green-800/40 dark:bg-green-900/20'
                    : 'border-neutral-200/60 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-900/70'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      quest.completed
                        ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    )}>
                      <quest.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{quest.title}</h3>
                      {!quest.completed && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 w-40 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${(quest.progress / quest.total) * 100}%` }} />
                          </div>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">{quest.progress}/{quest.total}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'rounded-full px-3 py-1 text-sm font-semibold',
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
          <div className="rounded-3xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">Top ARC participants</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Leaderboard styling now matches the updated shell language and your wallet-linked row uses the live rewards snapshot.</p>
              </div>
              <Wallet className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {LEADERBOARD.map((player) => {
                const playerTier = getLevelTier(player.level);
                const badge = BADGES[player.badge as BadgeId];
                return (
                  <div key={player.rank} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full font-bold',
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
                          <span className={cn('text-xs font-medium', playerTier.color)}>Level {player.level}</span>
                          <span className="text-xs">{badge?.icon}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900 dark:text-white">{player.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-primary-200 bg-primary-50/80 p-4 dark:border-primary-800 dark:bg-primary-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                    {snapshot.rank}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{isConnected ? shortenAddress(address) : 'Preview user'}</p>
                    <span className={cn('text-xs font-medium', tier.color)}>Level {snapshot.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-white">{snapshot.xp.toLocaleString()} XP</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function SignalCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}

function ActionCard({ icon, title, description, href }: { icon: JSX.Element; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            {icon}
          </div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}
