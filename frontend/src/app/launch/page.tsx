/**
 * Token Launch Page
 *
 * ARC launch workflow with stronger transaction-state feedback,
 * clearer recovery actions, and a shell consistent with the rest of the app.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Globe,
  Info,
  Loader2,
  Rocket,
  Sparkles,
  TrendingUp,
  Trophy,
  Twitter,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAllTokens, useApproveFactoryUSDC, useCreateToken, useCreationFee } from '@/hooks/useTokenFactory';
import { useGenerateTokenPage } from '@/hooks/useGenerateTokenPage';
import { useUSDCBalance } from '@/hooks/useMarketplace';
import { CURVE_TYPE_NAMES, CurveType } from '@/lib/contracts';

const QUICK_SUPPLY_PRESETS = ['1000000', '10000000', '100000000'];
const QUICK_PRICE_PRESETS = ['0.005', '0.01', '0.05'];
const CURVE_TYPE_DESCRIPTIONS = [
  'Predictable, steady price discovery that is easiest for first launches.',
  'Gentle early pricing with faster acceleration as demand increases.',
  'Aggressive scarcity profile intended for high-conviction launches.',
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatNumber(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString();
}

function formatAddress(address?: string | null) {
  if (!address) return 'Unavailable';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function appendCreatorLinks(description: string, socials: { website: string; x: string; telegram: string }) {
  const links = [
    socials.website.trim() ? `Website: ${socials.website.trim()}` : null,
    socials.x.trim() ? `X: ${socials.x.trim()}` : null,
    socials.telegram.trim() ? `Telegram: ${socials.telegram.trim()}` : null,
  ].filter(Boolean);

  if (!links.length) return description.trim();
  return `${description.trim()}\n\n${links.join('\n')}`;
}

export default function LaunchPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [telegram, setTelegram] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [basePrice, setBasePrice] = useState('0.01');
  const [slope, setSlope] = useState('1');
  const [curveType, setCurveType] = useState<number>(CurveType.LINEAR);
  const [step, setStep] = useState<'form' | 'approving' | 'creating' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<`0x${string}` | null>(null);
  const [tokenCountBeforeLaunch, setTokenCountBeforeLaunch] = useState<number | null>(null);

  const { generate, isLoading: isGenerating, error: generateError } = useGenerateTokenPage();
  const { fee, feeFormatted } = useCreationFee();
  const { balance, balanceFormatted } = useUSDCBalance(address || '');
  const { tokens, refetch: refetchTokens } = useAllTokens();
  const {
    approve,
    isLoading: isApproving,
    isSuccess: isApproved,
  } = useApproveFactoryUSDC();
  const {
    createToken,
    isLoading: isCreating,
    isSuccess: isCreated,
    createdTokenAddress: createdTokenAddressFromTx,
    error: createError,
  } = useCreateToken();

  const socials = useMemo(
    () => ({ website, x: xHandle, telegram }),
    [website, xHandle, telegram]
  );

  const hasInsufficientBalance = fee && balance ? balance < fee : false;
  const totalSupplyNumber = Number(totalSupply || '0');
  const basePriceNumber = Number(basePrice || '0');
  const slopeNumber = Number(slope || '0');
  const graduationSupply = Math.floor(totalSupplyNumber * 0.8);
  const estimatedRaise = graduationSupply * basePriceNumber;
  const isFormReady = Boolean(name.trim() && symbol.trim() && description.trim());
  const hasTrustLinks = Boolean(website.trim() || xHandle.trim() || telegram.trim());
  const launchReadinessSignals = [
    Boolean(name.trim() && symbol.trim()),
    Boolean(description.trim() && imageUrl.trim()),
    Boolean(totalSupplyNumber > 0 && basePriceNumber > 0 && slopeNumber >= 0),
    hasTrustLinks,
  ].filter(Boolean).length;
  const launchConfidenceSignals = [
    Boolean(name.trim() && symbol.trim()),
    Boolean(description.trim().length >= 120),
    Boolean(imageUrl.trim()),
    hasTrustLinks,
    Boolean(totalSupplyNumber > 0 && basePriceNumber > 0),
  ].filter(Boolean).length;
  const launchConfidence = Math.round((launchConfidenceSignals / 5) * 100);
  const marketEntryMode = curveType === CurveType.LINEAR ? 'Predictable' : curveType === CurveType.EXPONENTIAL ? 'Momentum-led' : 'Scarcity-led';
  const existingLaunches = tokens.length;

  const creatorRoutes = [
    {
      title: 'Profile',
      description: 'Review wallet identity, owned assets, and creator state.',
      href: address ? `/profile/${address}` : '/profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      title: 'Studio',
      description: 'Return to creator workflows, collections, and publish routes.',
      href: '/studio',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      title: 'Rewards',
      description: 'See how launch activity contributes to wallet-linked progression.',
      href: '/rewards',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      title: 'Stats',
      description: 'Check market context before or after the token goes live.',
      href: '/stats',
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  const resetLaunchState = () => {
    setError(null);
    setCreatedTokenAddress(null);
    setTokenCountBeforeLaunch(null);
    setStep('form');
  };

  useEffect(() => {
    if (isApproved && step === 'approving') {
      setStep('creating');
      createToken({
        name,
        symbol,
        description: appendCreatorLinks(description, socials),
        imageUrl,
        totalSupply,
        basePrice,
        slope,
        curveType,
      });
    }
  }, [isApproved, step, createToken, name, symbol, description, socials, imageUrl, totalSupply, basePrice, slope, curveType]);

  useEffect(() => {
    const syncCreatedToken = async () => {
      if (!isCreated) return;

      if (createdTokenAddressFromTx) {
        setCreatedTokenAddress(createdTokenAddressFromTx);
        setStep('success');
        return;
      }

      const refreshed = await refetchTokens();
      const refreshedTokens = ((refreshed.data as `0x${string}`[] | undefined) ?? tokens) || [];
      const latestToken = refreshedTokens[refreshedTokens.length - 1] ?? null;

      if (latestToken) {
        setCreatedTokenAddress(latestToken);
      }

      if (tokenCountBeforeLaunch !== null && refreshedTokens.length <= tokenCountBeforeLaunch) {
        setError('Token was created, but the new route is still indexing. You can open it from explore in a moment.');
      }

      setStep('success');
    };

    syncCreatedToken();
  }, [isCreated, createdTokenAddressFromTx, refetchTokens, tokenCountBeforeLaunch, tokens]);

  useEffect(() => {
    if (createError) {
      setStep('error');
      setError(createError.message);
    }
  }, [createError]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.length > 50) {
      setError('Name is required and must be 50 characters or less.');
      return;
    }
    if (!symbol.trim() || symbol.length > 10) {
      setError('Symbol is required and must be 10 characters or less.');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError('Description must be at least 20 characters so buyers understand the launch.');
      return;
    }
    if (Number.isNaN(totalSupplyNumber) || totalSupplyNumber < 1 || totalSupplyNumber > 1e12) {
      setError('Total supply must be between 1 and 1 trillion.');
      return;
    }
    if (Number.isNaN(basePriceNumber) || basePriceNumber <= 0) {
      setError('Base price must be greater than 0.');
      return;
    }
    if (Number.isNaN(slopeNumber) || slopeNumber < 0) {
      setError('Slope must be zero or greater.');
      return;
    }
    if (hasInsufficientBalance) {
      setError('Your wallet balance is below the current creation fee.');
      return;
    }

    setCreatedTokenAddress(null);
    setTokenCountBeforeLaunch(tokens.length);
    setStep('approving');
    approve(feeFormatted);
  };

  const stateMeta = {
    form: {
      label: 'Draft ready',
      title: 'Review details before launch',
      description: 'Use the preview and economics panel to sanity-check your ARC token before signing.',
      tone: 'neutral',
    },
    approving: {
      label: 'Wallet action',
      title: 'Approve the creation fee',
      description: 'Your wallet should open first so ARC can collect the USDC creation fee.',
      tone: 'blue',
    },
    creating: {
      label: 'Onchain in progress',
      title: 'Deploying token and market',
      description: 'The bonding-curve market is being created now. Keep this tab open until the success state appears.',
      tone: 'blue',
    },
    success: {
      label: 'Complete',
      title: 'Launch finished',
      description: 'Your token is live and ready for discovery.',
      tone: 'green',
    },
    error: {
      label: 'Attention needed',
      title: 'Launch needs another attempt',
      description: 'Review the message below, adjust inputs if needed, and retry when ready.',
      tone: 'red',
    },
  } as const;

  if (!isConnected) {
    return (
      <div className="min-h-screen px-4 py-12 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Zap className="h-3.5 w-3.5" />
              ARC launch
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Connect your wallet to open the ARC token launch flow.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Launch brings token identity, bonding-curve setup, trust links, and transaction-state feedback into one market-ready ARC workflow.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
              >
                <ArrowRight className="h-4 w-4" />
                Explore launches
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Sparkles className="h-4 w-4" />
                Open studio
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
              <Rocket className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">What launch covers</h2>
            <div className="mt-5 space-y-4">
              <StateRow icon={<Coins className="h-4 w-4" />} title="Token setup" description="Define name, ticker, description, visuals, and curve configuration in one place." />
              <StateRow icon={<Wallet className="h-4 w-4" />} title="Wallet-guided transactions" description="Clear approval, deploy, and success states keep the launch process easier to follow." />
              <StateRow icon={<TrendingUp className="h-4 w-4" />} title="Market-ready output" description="Route traders from the launch flow directly into the live token market page." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentState = stateMeta[step];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
      <div className="mb-8 grid gap-4 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Zap className="h-3.5 w-3.5" />
            ARC token launch
          </div>
          <h1 className="mb-3 text-3xl font-bold text-neutral-900 dark:text-white lg:text-4xl">
            Launch a token with clearer transaction states and a stronger ARC market entry.
          </h1>
          <p className="max-w-3xl text-neutral-600 dark:text-neutral-400">
            Build the token profile, shape price discovery with a bonding curve, and move from creation into live trading without leaving the ARC shell.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={address ? `/profile/${address}` : '/profile'} className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-black">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link href="/studio" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
              <Sparkles className="h-4 w-4" />
              Studio
            </Link>
            <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
              <BarChart3 className="h-4 w-4" />
              Stats
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Launch readiness</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{launchReadinessSignals}/4 complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${(launchReadinessSignals / 4) * 100}%` }} />
          </div>
          <div className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/80">
              <span>Connected wallet</span>
              <span className="font-medium text-neutral-900 dark:text-white">{formatAddress(address)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/80">
              <span>Wallet balance</span>
              <span className="font-medium text-neutral-900 dark:text-white">${balanceFormatted} USDC</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/80">
              <span>Creation fee</span>
              <span className="font-medium text-neutral-900 dark:text-white">${feeFormatted} USDC</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/80">
              <span>Launch confidence</span>
              <span className="font-medium text-neutral-900 dark:text-white">{launchConfidence}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Sparkles className="h-4 w-4" />
                Shell continuity
              </div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">Creator flow stays connected</div>
              <p className="mt-1 max-w-3xl text-sm text-current">
                Launch now behaves more like the rest of the connected ARC shell, keeping profile, studio, rewards, stats, and the post-launch token market route close at hand through the full creator flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                <Trophy className="h-4 w-4" />
                Rewards
              </Link>
              <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                <Wallet className="h-4 w-4" />
                Token markets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {step === 'success' ? (
        <div className="mx-auto max-w-4xl rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-sm dark:border-green-500/20 dark:from-green-500/10 dark:to-emerald-500/10 dark:bg-slate-900">
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600 dark:text-green-400" />
            <h2 className="mb-2 text-2xl font-bold text-green-900 dark:text-green-200">Token launched successfully</h2>
            <p className="mx-auto mb-4 max-w-2xl text-green-800 dark:text-green-300">
              Your token has been deployed and is ready for discovery. The next best move is opening the live market route, then reviewing how the launch fits into your profile, studio, and rewards surfaces.
            </p>
          </div>

          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-green-200 bg-white/70 p-4 text-left text-sm text-green-900 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-green-200">
            <div className="flex items-center justify-between">
              <span>Created token route</span>
              <span className="font-semibold">{formatAddress(createdTokenAddress)}</span>
            </div>
            <div className="mt-2 text-green-700 dark:text-green-300">
              {createdTokenAddress ? 'Primary action now opens the live token market page.' : 'Route indexing is still catching up, so explore remains available as the fallback action.'}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <SuccessReadCard title="Creator wallet" value={formatAddress(address)} description="The connected shell keeps this creator identity active across profile and studio." />
            <SuccessReadCard title="Market route" value={createdTokenAddress ? 'Ready' : 'Indexing'} description="The live token destination is now the primary post-launch handoff." />
            <SuccessReadCard title="Next flow" value="Profile + rewards" description="Launch activity is now positioned as part of a broader connected creator journey." />
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => router.push(createdTokenAddress ? `/token/${createdTokenAddress}` : '/explore?tab=tokens')}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              {createdTokenAddress ? 'Open token market' : 'View live tokens'}
            </button>
            <button
              onClick={() => router.push(address ? `/profile/${address}` : '/profile')}
              className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50 dark:border-green-500/20 dark:bg-slate-900 dark:text-green-300"
            >
              Open profile
            </button>
            <button
              onClick={() => router.push('/studio')}
              className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50 dark:border-green-500/20 dark:bg-slate-900 dark:text-green-300"
            >
              Return to studio
            </button>
            <button
              onClick={() => {
                resetLaunchState();
                router.refresh();
              }}
              className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50 dark:border-green-500/20 dark:bg-slate-900 dark:text-green-300"
            >
              Launch another token
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className={cn(
              'rounded-3xl border p-5 shadow-sm',
              step === 'error'
                ? 'border-red-200 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/10'
                : step === 'approving' || step === 'creating'
                  ? 'border-blue-200 bg-blue-50/80 dark:border-blue-500/20 dark:bg-blue-500/10'
                  : 'border-neutral-200/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/70'
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl',
                  step === 'error'
                    ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                    : step === 'approving' || step === 'creating'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                )}>
                  {step === 'error' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : step === 'approving' || step === 'creating' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-current/10 bg-white/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide dark:bg-white/5">
                      {currentState.label}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Current state: {step}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{currentState.title}</h2>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{currentState.description}</p>
                  {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
                </div>
                {step === 'error' && (
                  <button
                    type="button"
                    onClick={resetLaunchState}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950 dark:text-red-300"
                  >
                    Return to draft
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">1. Token identity</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Give traders a clear signal in the first five seconds.</p>
                </div>
                <div className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                  Core
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Token name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arc Alpha"
                    maxLength={50}
                    required
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Ticker *</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="AARC"
                    maxLength={10}
                    required
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 uppercase text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description *</label>
                  <button
                    type="button"
                    disabled={isGenerating || !name.trim() || !symbol.trim() || !description.trim() || description.trim().length < 10}
                    onClick={() => {
                      generate(
                        { name, symbol, description, totalSupply, basePrice, curveType },
                        {
                          onSuccess: (data) => {
                            if (data.fullDescription) {
                              setDescription(data.fullDescription);
                            }
                          },
                        }
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isGenerating ? 'Generating' : 'AI polish'}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the token, why it exists, and why traders should care."
                  rows={5}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Keep this sharp, credible, and trader-friendly.</span>
                  <span>{description.trim().length} chars</span>
                </div>
                {generateError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{generateError.message}</p>}
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Image URL *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/token-image.png"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">2. Bonding curve setup</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Tune supply, entry price, and how aggressively price moves.</p>
                </div>
                <div className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                  Market design
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Total supply</label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SUPPLY_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTotalSupply(preset)}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-blue-300 hover:text-blue-700 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          {formatNumber(preset)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    min="1"
                    max="1000000000000"
                    required
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Graduation checkpoint at 80% sold: {formatNumber(String(graduationSupply))} tokens.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Base price (USDC)</label>
                      <div className="flex gap-2">
                        {QUICK_PRICE_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBasePrice(preset)}
                            className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-blue-300 hover:text-blue-700 dark:border-neutral-700 dark:text-neutral-300"
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      step="0.000001"
                      min="0.000001"
                      required
                      className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">The first buyer sees this entry price.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Slope</label>
                    <input
                      type="number"
                      value={slope}
                      onChange={(e) => setSlope(e.target.value)}
                      step="0.1"
                      min="0"
                      required
                      className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Higher slope means faster price acceleration.</p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Curve type</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {CURVE_TYPE_NAMES.map((typeName, i) => (
                      <button
                        key={typeName}
                        type="button"
                        onClick={() => setCurveType(i)}
                        className={cn(
                          'rounded-2xl border px-4 py-4 text-left transition',
                          curveType === i
                            ? 'border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-500/10'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900'
                        )}
                      >
                        <div className="mb-1 font-semibold text-neutral-900 dark:text-white">{typeName}</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{CURVE_TYPE_DESCRIPTIONS[i] || 'Curve profile available.'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">3. Creator trust layer</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Add destination links so traders can verify the project fast.</p>
                </div>
                <div className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                  Conversion
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Globe className="h-4 w-4" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://project.xyz"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Twitter className="h-4 w-4" />
                    X profile
                  </label>
                  <input
                    type="text"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    placeholder="https://x.com/project"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <MessageCircleProxy />
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="https://t.me/project"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <div className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold">Launch cost and payout model</p>
                  <p>Creation fee: ${feeFormatted} USDC. Wallet balance: ${balanceFormatted} USDC.</p>
                  <p>Graduation model: 50% creator treasury, 25% staking rewards, 25% platform allocation.</p>
                  <p>Use the preview, economics, and connected-shell route cards to validate positioning before you sign anything.</p>
                </div>
              </div>
            </section>

            {hasInsufficientBalance && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  Insufficient USDC balance for the current creation fee.
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={hasInsufficientBalance || isApproving || isCreating || !isFormReady}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Approving USDC
                  </>
                ) : isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating token
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Launch token for ${feeFormatted}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetLaunchState}
                disabled={isApproving || isCreating}
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200"
              >
                Reset state
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Live preview</h2>
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">What traders see</span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-inner dark:border-white/10">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-2xl font-bold">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={name || 'Token preview'} className="h-full w-full object-cover" />
                    ) : (
                      <span>{symbol.trim().slice(0, 2) || '??'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-xl font-bold">{name.trim() || 'Your Token Name'}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-blue-100">${symbol.trim() || 'TICKER'}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-blue-100/80">{description.trim() || 'Your token story will appear here. Explain the mission, meme, or utility clearly enough for a first-time trader.'}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewStat icon={<Coins className="h-4 w-4" />} label="Supply" value={formatNumber(totalSupply)} />
                  <PreviewStat icon={<TrendingUp className="h-4 w-4" />} label="Base price" value={`$${basePrice || '0'}`} />
                  <PreviewStat icon={<Zap className="h-4 w-4" />} label="Curve" value={CURVE_TYPE_NAMES[curveType] || 'Linear'} />
                  <PreviewStat icon={<Rocket className="h-4 w-4" />} label="Graduation" value={`${formatNumber(String(graduationSupply))} sold`} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-100/85">
                  {website.trim() && <PreviewBadge>{website.trim()}</PreviewBadge>}
                  {xHandle.trim() && <PreviewBadge>{xHandle.trim()}</PreviewBadge>}
                  {telegram.trim() && <PreviewBadge>{telegram.trim()}</PreviewBadge>}
                  {!website.trim() && !xHandle.trim() && !telegram.trim() && <PreviewBadge>Add socials to build trust</PreviewBadge>}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">Launch economics</h2>
              <div className="space-y-3 text-sm">
                <MetricRow label="Creation fee" value={`$${feeFormatted} USDC`} />
                <MetricRow label="Projected graduation supply" value={formatNumber(String(graduationSupply))} />
                <MetricRow label="Estimated raise at base price" value={`$${estimatedRaise.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                <MetricRow label="Curve slope" value={slope || '0'} />
                <MetricRow label="Entry mode" value={marketEntryMode} />
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                Strong launches combine a clean ticker, instant social proof, and a curve that does not punish early traders too hard.
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Creator snapshot</h2>
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">Connected shell</span>
              </div>
              <div className="space-y-3 text-sm">
                <MetricRow label="Wallet" value={formatAddress(address)} />
                <MetricRow label="Existing launches" value={existingLaunches.toString()} />
                <MetricRow label="Trust links" value={hasTrustLinks ? 'Added' : 'Missing'} />
                <MetricRow label="Description quality" value={description.trim().length >= 120 ? 'Strong' : 'Needs more detail'} />
              </div>
              <div className="mt-4 grid gap-3">
                {creatorRoutes.map((route) => (
                  <RouteCard key={route.title} title={route.title} description={route.description} href={route.href} icon={route.icon} />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Transaction flow</h2>
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">Guided state UX</span>
              </div>
              <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <FlowStep active={step === 'approving'} complete={step === 'creating' || step === 'success'} title="Approve USDC" description="Allow the factory contract to collect the current creation fee." />
                <FlowStep active={step === 'creating'} complete={step === 'success'} title="Deploy token" description="Create the token and initialize the bonding-curve market." />
                <FlowStep active={step === 'success'} complete={step === 'success'} title="Open market page" description="Jump directly into the live token market once the route is indexed." />
              </div>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950/60">
                <div className="font-medium text-neutral-900 dark:text-white">{currentState.title}</div>
                <div className="mt-1 text-neutral-500 dark:text-neutral-400">{currentState.description}</div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function PreviewStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-blue-100/70">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function PreviewBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{children}</span>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/60">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-semibold text-neutral-900 dark:text-white">{value}</span>
    </div>
  );
}

function FlowStep({
  title,
  description,
  active,
  complete,
}: {
  title: string;
  description: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold',
          complete
            ? 'border-green-500 bg-green-500 text-white'
            : active
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'
        )}
      >
        {complete ? '✓' : active ? '•' : '○'}
      </div>
      <div>
        <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
        <div className="mt-1 text-neutral-500 dark:text-neutral-400">{description}</div>
      </div>
    </div>
  );
}

function StateRow({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">{icon}</div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: ReactNode }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">{icon}</div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function SuccessReadCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-white/70 p-4 dark:border-green-500/20 dark:bg-slate-950/40">
      <div className="text-sm text-green-800 dark:text-green-300">{title}</div>
      <div className="mt-1 text-xl font-bold text-green-900 dark:text-green-200">{value}</div>
      <div className="mt-2 text-sm text-green-700 dark:text-green-300">{description}</div>
    </div>
  );
}

function MessageCircleProxy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-5.4-1.9L3 19l1-4.1A8.38 8.38 0 0 1 2 9.5 8.5 8.5 0 0 1 10.5 1a8.38 8.38 0 0 1 5.4 1.9A8.5 8.5 0 0 1 21 11.5Z" />
    </svg>
  );
}
