'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ArrowRight, BarChart3, Rocket, Search, Sparkles, Trophy, User, Wallet } from 'lucide-react';

const profileRoutes = [
  {
    title: 'Open token markets',
    description: 'Jump from account access into launched-token discovery and live ARC market routes.',
    href: '/explore?tab=tokens',
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    title: 'Review stats',
    description: 'Use the ARC analytics surface before returning to profile and wallet-linked flows.',
    href: '/stats',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Open rewards',
    description: 'Check loyalty, quests, and account progression from the same connected shell.',
    href: '/rewards',
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    title: 'Launch a token',
    description: 'Move from account identity into ARC creation and launch workflows.',
    href: '/launch',
    icon: <Rocket className="h-4 w-4" />,
  },
];

export default function ProfileIndexPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      router.replace(`/profile/${address}`);
    }
  }, [isConnected, address, router]);

  if (isConnected && address) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Wallet className="h-3.5 w-3.5" />
              ARC account access
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Connect your wallet to open your ARC profile.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Your ARC profile brings together marketplace activity, launched assets, and wallet-linked identity in one account surface.
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
                href="/launch"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Rocket className="h-4 w-4" />
                Launch a token
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
              <User className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">What unlocks after connect</h2>
            <div className="mt-5 space-y-4">
              <FeatureRow
                icon={<User className="h-4 w-4" />}
                title="Wallet-based profile"
                description="Open your personal ARC identity and route straight to your wallet address page."
              />
              <FeatureRow
                icon={<Sparkles className="h-4 w-4" />}
                title="Studio and launch flows"
                description="Move from browsing into ARC creation and launch workflows without leaving the shell."
              />
              <FeatureRow
                icon={<ArrowRight className="h-4 w-4" />}
                title="Account continuity"
                description="Keep profile, settings, rewards, and discovery paths aligned around one connected wallet."
              />
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <User className="h-4 w-4" />
                  Profile state
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">Wallet connection required</div>
                <p className="mt-1 max-w-3xl text-sm text-current">
                  This profile entry surface now works as a clearer shell handoff, explaining the wallet requirement while keeping users connected to discovery, launch, analytics, and rewards routes.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  <Trophy className="h-4 w-4" />
                  Rewards
                </Link>
                <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <OverviewCard label="Profile routing" value="Wallet-based" hint="Auto-routes after connect" />
          <OverviewCard label="Rewards access" value="Live route" hint="Open loyalty and quests" />
          <OverviewCard label="Analytics access" value="Live route" hint="Review stats before action" />
          <OverviewCard label="Launch access" value="Live route" hint="Create from the same shell" />
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account routes</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Move into the highest-value ARC surfaces while profile access is waiting on wallet connection.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {profileRoutes.map((route) => (
              <RouteCard key={route.title} {...route} />
            ))}
          </div>
        </section>

        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Use the wallet button in the navigation bar to connect, then ARC will route you directly into your wallet-based profile.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
          {icon}
        </div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
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

function RouteCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
}) {
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
