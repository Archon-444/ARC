'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Package,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import NFTCard from '@/components/NFTCard';
import { formatUSDC } from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { ProfileHeaderSummary } from '@/components/profile/ProfileHeaderSummary';

type TabType = 'owned' | 'created' | 'activity' | 'listings';

interface ActivityItem {
  id: string;
  price: string;
  createdAt: string;
  nft: {
    id: string;
    tokenId: string;
    tokenURI: string;
    collection: {
      name: string;
    };
  };
  type: 'purchase' | 'sale';
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function sumActivityValue(items: ActivityItem[]) {
  return items.reduce((total, item) => total + BigInt(item.price || '0'), 0n);
}

function averageActivityValue(items: ActivityItem[]) {
  if (items.length === 0) return 0n;
  return sumActivityValue(items) / BigInt(items.length);
}

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params?.address as string;
  const { address: connectedAddress } = useAccount();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('owned');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const isOwnProfile = connectedAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    if (profileAddress) {
      loadUserData();
    }
  }, [profileAddress]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userId = profileAddress.toLowerCase();
      const data: any = await fetchGraphQL(GET_USER, { id: userId });

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(profileAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const activities: ActivityItem[] = user
    ? [
        ...(user.purchases || []).map((p: any) => ({ ...p, type: 'purchase' as const })),
        ...(user.sales || []).map((s: any) => ({ ...s, type: 'sale' as const })),
      ].sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 lg:px-6 lg:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
            <div className="space-y-3">
              <div className="h-6 w-32 rounded-full bg-neutral-200/80 dark:bg-white/10" />
              <div className="h-12 w-72 rounded-2xl bg-neutral-200/80 dark:bg-white/10" />
              <div className="h-5 w-full max-w-2xl rounded-xl bg-neutral-200/60 dark:bg-white/5" />
              <div className="h-5 w-2/3 rounded-xl bg-neutral-200/60 dark:bg-white/5" />
            </div>
            <div className="h-48 rounded-3xl bg-neutral-200/70 dark:bg-white/5" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-3xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen px-4 py-12 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Profile not found</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
              This wallet has not created a visible ARC profile state yet, or it has not interacted with the marketplace surfaces that populate this view.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/profile" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black">
                <User className="h-4 w-4" />
                Open account gateway
              </Link>
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                <Search className="h-4 w-4" />
                Explore markets
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ownedNFTs = user.ownedNFTs || [];
  const createdNFTs = user.createdNFTs || [];
  const activeListings = user.listings || [];
  const purchases = (user.purchases || []).map((p: any) => ({ ...p, type: 'purchase' as const }));
  const sales = (user.sales || []).map((s: any) => ({ ...s, type: 'sale' as const }));
  const totalSpent = BigInt(user.totalSpent || 0);
  const totalEarned = BigInt(user.totalEarned || 0);
  const netFlow = totalEarned - totalSpent;
  const totalPurchaseVolume = sumActivityValue(purchases);
  const totalSaleVolume = sumActivityValue(sales);
  const averagePurchase = averageActivityValue(purchases);
  const averageSale = averageActivityValue(sales);

  const quickRoutes = [
    {
      title: 'Account gateway',
      description: 'Return to the top-level account entry and profile handoff surface.',
      href: '/profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      title: 'Rewards',
      description: 'Keep loyalty, quests, and progression connected to your account.',
      href: '/rewards',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      title: 'Settings',
      description: 'Manage account utilities, privacy, and appearance in one place.',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      title: isOwnProfile ? 'Launch' : 'Explore',
      description: isOwnProfile
        ? 'Move from wallet identity into ARC creation and listing workflows.'
        : 'Return to discovery and browse the broader ARC marketplace.',
      href: isOwnProfile ? '/launch' : '/explore',
      icon: isOwnProfile ? <Rocket className="h-4 w-4" /> : <Search className="h-4 w-4" />,
    },
  ];

  const tabs = [
    { id: 'owned' as const, label: `Owned (${ownedNFTs.length})` },
    { id: 'created' as const, label: `Created (${createdNFTs.length})` },
    { id: 'listings' as const, label: `Listings (${activeListings.length})` },
    { id: 'activity' as const, label: `Activity (${activities.length})` },
  ];

  return (
    <div className="min-h-screen px-4 py-8 lg:px-6 lg:py-10" data-testid="wallet-profile-page">
      <div className="mx-auto max-w-7xl space-y-8">
        <ProfileHeaderSummary
          displayName={isOwnProfile ? 'Your ARC account' : undefined}
          walletAddress={profileAddress}
          isOwnProfile={isOwnProfile}
          copied={copiedAddress}
          onCopy={copyAddress}
          actions={[
            { key: 'rewards', label: 'Rewards', href: '/rewards' },
            { key: 'settings', label: 'Settings', href: '/settings' },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="Owned assets" value={ownedNFTs.length.toString()} hint="Wallet-held marketplace items" />
          <OverviewCard label="Created assets" value={createdNFTs.length.toString()} hint="Minted and published by this wallet" />
          <OverviewCard label="Total spent" value={`${formatUSDC(totalSpent)} USDC`} hint="Marketplace purchases" />
          <OverviewCard label="Total earned" value={`${formatUSDC(totalEarned)} USDC`} hint="Marketplace sales" />
        </div>

        <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Wallet metrics</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">This destination keeps the richer computed wallet view, using indexed purchase and sale history to add live account signal beyond static holdings counts.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewCard label="Purchases" value={purchases.length.toString()} hint={`${formatUSDC(totalPurchaseVolume)} USDC total`} />
            <OverviewCard label="Sales" value={sales.length.toString()} hint={`${formatUSDC(totalSaleVolume)} USDC total`} />
            <OverviewCard label="Average buy" value={`${formatUSDC(averagePurchase)} USDC`} hint="Average marketplace purchase size" />
            <OverviewCard label="Average sale" value={`${formatUSDC(averageSale)} USDC`} hint="Average marketplace sale size" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SignalCard
              title="Net cash flow"
              value={`${netFlow < 0n ? '-' : ''}${formatUSDC(netFlow < 0n ? -netFlow : netFlow)} USDC`}
              tone={netFlow >= 0n ? 'positive' : 'negative'}
              description={netFlow >= 0n ? 'This wallet has earned at least as much as it has spent across indexed marketplace activity.' : 'This wallet has spent more than it has earned across indexed marketplace activity.'}
            />
            <SignalCard
              title="Activity density"
              value={activities.length.toString()}
              tone="neutral"
              description="Combined purchase and sale events keep the account surface meaningfully alive and aligned with the richer gateway promise." 
            />
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account utilities</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Move directly between the wallet destination and the highest-value ARC product surfaces.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {quickRoutes.map((route) => (
              <RouteCard key={route.title} {...route} />
            ))}
          </div>
        </section>

        <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'owned' && (
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            {ownedNFTs.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="No owned assets"
                description={isOwnProfile ? 'Start by exploring ARC inventory and token-market routes to build your wallet profile.' : 'This wallet does not currently show owned ARC assets.'}
                href={isOwnProfile ? '/explore' : '/explore?tab=all'}
                cta={isOwnProfile ? 'Explore markets' : 'Browse inventory'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ownedNFTs.map((nft: any) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'created' && (
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            {createdNFTs.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="No created assets"
                description={isOwnProfile ? 'Use launch workflows to publish your first ARC asset.' : 'This wallet has not created ARC assets yet.'}
                href={isOwnProfile ? '/launch' : '/explore'}
                cta={isOwnProfile ? 'Open launch' : 'Explore markets'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {createdNFTs.map((nft: any) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'listings' && (
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            {activeListings.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-6 w-6" />}
                title="No active listings"
                description={isOwnProfile ? 'Create or list assets to surface sell-side activity in your ARC profile.' : 'This wallet has no active ARC listings right now.'}
                href={isOwnProfile ? '/launch' : '/explore'}
                cta={isOwnProfile ? 'Open launch' : 'Explore markets'}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeListings.map((listing: any) => {
                  const nftWithListing = {
                    ...listing.nft,
                    listing: {
                      id: listing.id,
                      price: listing.price,
                      active: true,
                    },
                  };
                  return <NFTCard key={listing.id} nft={nftWithListing} />;
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            {activities.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No activity yet"
                description={isOwnProfile ? 'Your marketplace purchases and sales will appear here once activity starts flowing through ARC.' : 'This wallet does not yet show ARC marketplace activity.'}
                href="/explore"
                cta="Explore markets"
              />
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl',
                        activity.type === 'purchase'
                          ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      )}>
                        {activity.type === 'purchase' ? <Package className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {activity.type === 'purchase' ? 'Purchased' : 'Sold'}{' '}
                          <Link href={`/nft/${activity.nft.collection.name}/${activity.nft.tokenId}`} className="text-primary-600 hover:underline dark:text-primary-400">
                            {activity.nft.collection.name} #{activity.nft.tokenId}
                          </Link>
                        </p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(parseInt(activity.createdAt) * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-semibold text-neutral-900 dark:text-white">{formatUSDC(BigInt(activity.price))} USDC</p>
                      <p className={cn('text-sm', activity.type === 'sale' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {activity.type === 'sale' ? '+' : '-'}{formatUSDC(BigInt(activity.price))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function SignalCard({ title, value, description, tone }: { title: string; value: string; description: string; tone: 'positive' | 'negative' | 'neutral' }) {
  const toneClasses = {
    positive: 'border-green-200 bg-green-50/70 dark:border-green-500/20 dark:bg-green-500/10',
    negative: 'border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/10',
    neutral: 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60',
  } as const;

  return (
    <div className={`rounded-3xl border p-5 ${toneClasses[tone]}`}>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{description}</div>
    </div>
  );
}

function RouteCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: JSX.Element }) {
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
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, description, href, cta }: { icon: JSX.Element; title: string; description: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-14 text-center dark:border-white/10 dark:bg-slate-950/60">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
