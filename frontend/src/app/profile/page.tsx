'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  ArrowRight,
  BarChart3,
  Compass,
  LoaderCircle,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';

const previewCards = [
  {
    label: 'Holdings',
    value: 'Wallet inventory',
    hint: 'See what you own across ARC marketplace surfaces.',
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    label: 'Listings',
    value: 'Sell-side activity',
    hint: 'Track what is live, listed, and ready to move.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Activity',
    value: 'Live account signal',
    hint: 'Review purchases, sales, and wallet-linked movement.',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: 'Rewards',
    value: 'Loyalty and quests',
    hint: 'Keep progression and rewards attached to your account journey.',
    icon: <Trophy className="h-4 w-4" />,
  },
];

export default function ProfileIndexPage() {
  const router = useRouter();
  const { address, isConnected, isConnecting, isReconnecting, status } = useAccount();

  const gatewayState = useMemo(() => {
    if (isConnecting || isReconnecting || status === 'connecting' || status === 'reconnecting') {
      return 'loading' as const;
    }

    if (isConnected && address) {
      return 'connected' as const;
    }

    return 'disconnected' as const;
  }, [address, isConnected, isConnecting, isReconnecting, status]);

  const primaryAction =
    gatewayState === 'connected'
      ? {
          label: 'Open my profile',
          icon: <ArrowRight className="h-4 w-4" />,
          onClick: () => router.push(`/profile/${address}`),
        }
      : {
          label: 'Connect wallet',
          icon: <Wallet className="h-4 w-4" />,
          onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        };

  const secondaryLink = gatewayState === 'connected'
    ? { href: '/rewards', label: 'Rewards', icon: <Trophy className="h-4 w-4" /> }
    : { href: '/explore', label: 'Explore marketplace', icon: <Compass className="h-4 w-4" /> };

  const quickActions = gatewayState === 'connected'
    ? [
        { title: 'My profile', href: `/profile/${address}`, icon: <User className="h-4 w-4" />, description: 'Continue into your wallet workspace.' },
        { title: 'Rewards', href: '/rewards', icon: <Trophy className="h-4 w-4" />, description: 'Check loyalty, quests, and account progression.' },
        { title: 'Settings', href: '/settings', icon: <ShieldCheck className="h-4 w-4" />, description: 'Manage account preferences and connected flows.' },
        { title: 'Launch', href: '/launch', icon: <Rocket className="h-4 w-4" />, description: 'Move from account identity into creation flows.' },
      ]
    : [
        { title: 'Explore', href: '/explore', icon: <Search className="h-4 w-4" />, description: 'Browse marketplace inventory before connecting.' },
        { title: 'Rewards', href: '/rewards', icon: <Trophy className="h-4 w-4" />, description: 'Preview loyalty and progression surfaces.' },
        { title: 'Stats', href: '/stats', icon: <BarChart3 className="h-4 w-4" />, description: 'Review ARC analytics and market signals.' },
        { title: 'Launch', href: '/launch', icon: <Rocket className="h-4 w-4" />, description: 'See how account identity connects to creation.' },
      ];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-6 lg:py-14" data-testid="profile-gateway-page">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <User className="h-3.5 w-3.5" />
              ARC account gateway
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Your ARC account
            </h1>
            <p className="mt-4 max-w-3xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Track holdings, listings, rewards, and wallet activity in one place, then move into your richer wallet profile when you are ready.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
                data-testid="profile-gateway-primary-cta"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
              <Link
                href={secondaryLink.href}
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                {secondaryLink.icon}
                {secondaryLink.label}
              </Link>
            </div>

            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {gatewayState === 'connected'
                ? 'Your wallet is connected. Use the handoff below to enter the richer account workspace.'
                : 'Use the wallet button in the navigation bar to connect. This page previews what your account unlocks before you do.'}
            </p>
          </div>

          <ConnectionCard gatewayState={gatewayState} address={address} onContinue={() => address && router.push(`/profile/${address}`)} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {previewCards.map((card) => (
            <PreviewCard key={card.label} {...card} />
          ))}
        </section>

        <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account utility</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Keep rewards, settings, discovery, and launch flows connected to the same account journey.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {gatewayState === 'connected' ? 'Connected handoff ready' : 'Preview mode'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <RouteCard key={action.title} {...action} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/70 p-6 dark:border-white/10 dark:bg-slate-950/60">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {gatewayState === 'connected' ? 'Ready to continue into your wallet profile?' : 'What happens after connect?'}
              </h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {gatewayState === 'connected'
                  ? 'Your richer wallet destination keeps holdings, listings, activity, and computed wallet metrics together without forcing an abrupt redirect from this page.'
                  : 'Once connected, ARC will keep your identity, holdings, listings, activity, and rewards aligned under the same account flow.'}
              </p>
            </div>
            {gatewayState === 'connected' ? (
              <button
                type="button"
                onClick={() => address && router.push(`/profile/${address}`)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black"
              >
                Open wallet profile
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black"
              >
                Browse first
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ConnectionCard({ gatewayState, address, onContinue }: { gatewayState: 'connected' | 'disconnected' | 'loading'; address?: string; onContinue: () => void }) {
  if (gatewayState === 'loading') {
    return (
      <div className="rounded-3xl border border-neutral-200/60 bg-neutral-50/80 p-6 dark:border-white/10 dark:bg-slate-950/60">
        <div className="mb-4 flex items-center gap-3 text-neutral-900 dark:text-white">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary-500" />
          <h2 className="text-xl font-semibold">Preparing your account</h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ARC is checking your wallet state and preparing the best next account action.
        </p>
        <div className="mt-5 grid gap-3">
          <div className="h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/10" />
          <div className="h-20 rounded-2xl bg-neutral-200/60 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (gatewayState === 'connected') {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50/70 p-6 dark:border-green-500/20 dark:bg-green-500/10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-green-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Connected
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Continue to your wallet profile</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Open your richer account workspace for holdings, listings, activity, and computed wallet metrics.
        </p>
        <div className="mt-4 rounded-2xl border border-green-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-700 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-neutral-200">
          <span className="font-mono">{address}</span>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black"
        >
          Open my profile
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-500/20 dark:bg-blue-500/10">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-slate-950/40 dark:text-blue-300">
        <Wallet className="h-3.5 w-3.5" />
        Wallet required
      </div>
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Preview your account before you connect</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        ARC keeps profile value visible up front so the page feels like an account gateway instead of a holding screen.
      </p>
      <ul className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
        <li className="rounded-2xl border border-blue-200/70 bg-white/80 px-4 py-3 dark:border-blue-500/20 dark:bg-slate-950/40">Holdings, listings, and activity live in one wallet-linked destination.</li>
        <li className="rounded-2xl border border-blue-200/70 bg-white/80 px-4 py-3 dark:border-blue-500/20 dark:bg-slate-950/40">Rewards, settings, and launch flows stay connected to the same account story.</li>
      </ul>
    </div>
  );
}

function PreviewCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: JSX.Element }) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
        {icon}
      </div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
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
