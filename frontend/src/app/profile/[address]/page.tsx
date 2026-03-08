'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Copy,
  Package,
  Rocket,
  Search,
  ShieldCheck,
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
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
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 font-semibold text-white transition hover:bg-primary-600">
                <Search className="h-4 w-4" />
                Explore markets
              </Link>
              <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                <Trophy className="h-4 w-4" />
                Open rewards
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

  const quickRoutes = [
    {
      title: 'Open token markets',
      description: 'Jump from wallet identity into launched-token discovery and live ARC market routes.',
      href: '/explore?tab=tokens',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      title: 'Review stats',
      description: 'Use analytics before returning to account, trading, or launch actions.',
      href: '/stats',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: 'Open rewards',
      description: 'Check loyalty, quests, and progression from the same connected shell.',
      href: '/rewards',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      title: isOwnProfile ? 'Open studio' : 'Explore markets',
      description: isOwnProfile
        ? 'Move from profile into ARC creation and listing workflows.'
        : 'Return to discovery and browse the broader ARC marketplace.',
      href: isOwnProfile ? '/studio' : '/explore',
      icon: isOwnProfile ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />,
    },
  ];

  const tabs = [
    { id: 'owned' as const, label: `Owned (${ownedNFTs.length})` },
    { id: 'created' as const, label: `Created (${createdNFTs.length})` },
    { id: 'listings' as const, label: `Listings (${activeListings.length})` },
    { id: 'activity' as const, label: `Activity (${activities.length})` },
  ];

  return (
    <div className="min-h-screen px-4 py-8 lg:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <User className="h-3.5 w-3.5" />
              ARC profile
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 text-2xl font-bold text-white shadow-lg shadow-primary-500/20 lg:h-24 lg:w-24 lg:text-3xl">
                {profileAddress.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-4xl">
                    {isOwnProfile ? 'Your ARC profile' : shortenAddress(profileAddress)}
                  </h1>
                  {isOwnProfile && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                      You
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-mono">{profileAddress}</span>
                  <button
                    onClick={copyAddress}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200 dark:hover:text-primary-300"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedAddress ? 'Copied' : 'Copy address'}
                  </button>
                </div>
                <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
                  ARC now treats the wallet profile as a connected shell destination, combining holdings, creation, listings, and activity with faster routes into discovery, rewards, analytics, and launch flows.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Profile state</h2>
              <span className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                isOwnProfile
                  ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
                  : 'border border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-300'
              )}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {isOwnProfile ? 'Connected identity' : 'Public wallet view'}
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {isOwnProfile
                ? 'You are viewing your wallet-linked account surface, with direct continuity into creation, loyalty, analytics, and token-market routes.'
                : 'You are viewing a public ARC wallet surface, with routes back into discovery, rewards, and broader product navigation.'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/settings" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/launch" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Launch a token
                <Rocket className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="Owned assets" value={ownedNFTs.length.toString()} hint="Wallet-held marketplace items" />
          <OverviewCard label="Created assets" value={createdNFTs.length.toString()} hint="Minted and published by this wallet" />
          <OverviewCard label="Total spent" value={`${formatUSDC(BigInt(user.totalSpent || 0))} USDC`} hint="Marketplace purchases" />
          <OverviewCard label="Total earned" value={`${formatUSDC(BigInt(user.totalEarned || 0))} USDC`} hint="Marketplace sales" />
        </div>

        <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Shell routes</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Move directly from profile into the highest-value ARC product surfaces.</p>
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
                description={isOwnProfile ? 'Use Studio and launch workflows to publish your first ARC asset.' : 'This wallet has not created ARC assets yet.'}
                href={isOwnProfile ? '/studio' : '/explore'}
                cta={isOwnProfile ? 'Open studio' : 'Explore markets'}
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
                href={isOwnProfile ? '/studio' : '/explore'}
                cta={isOwnProfile ? 'Open studio' : 'Explore markets'}
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
