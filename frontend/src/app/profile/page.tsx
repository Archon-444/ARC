'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ArrowRight, Rocket, Search, Sparkles, User, Wallet } from 'lucide-react';

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
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Wallet className="h-3.5 w-3.5" />
            ARC account access
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
            Connect your wallet to open your ARC profile.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
            Your profile brings together marketplace activity, launched assets, and wallet-linked identity in one account surface.
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

          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Use the wallet button in the navigation bar to connect, then ARC will route you directly into your wallet-based profile.
          </p>
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
              description="Move from browsing into creation and launch workflows without leaving the shell."
            />
            <FeatureRow
              icon={<ArrowRight className="h-4 w-4" />}
              title="Account continuity"
              description="Keep profile, settings, rewards, and discovery paths aligned around one connected wallet."
            />
          </div>
        </div>
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
