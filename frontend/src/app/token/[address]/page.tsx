'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatUnits, parseEther } from 'viem';
import { useAccount, useConnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  Flame,
  Globe,
  MessageSquare,
  Rocket,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { CONTRACTS } from '@/lib/contracts';
import { useArcGasWithBuffer } from '@/hooks/useArcGasEstimate';
import {
  useArcNativeBalance,
  useArcSufficientBalance,
  useArcUSDCBalance,
} from '@/hooks/useArcBalance';
import {
  useApproveAMMUSDC,
  useBuyTokens,
  useCalculateBuyReturn,
  useCalculateSellReturn,
  useCurrentPrice,
  useGraduationProgress,
  useSellTokens,
} from '@/hooks/useTokenAMM';
import ArcTokenFactoryABI from '@/hooks/abis/ArcTokenFactory.json';
import ERC20ABI from '@/hooks/abis/ERC20.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const demoTrades = [
  { wallet: '0x8f2c…91d4', side: 'Buy', amount: '$1,280', tokens: '12,840', age: '18s ago' },
  { wallet: '0x13aa…42bc', side: 'Buy', amount: '$640', tokens: '6,155', age: '44s ago' },
  { wallet: '0x2c71…d111', side: 'Sell', amount: '$310', tokens: '2,420', age: '2m ago' },
  { wallet: '0xf9b4…7710', side: 'Buy', amount: '$2,480', tokens: '21,005', age: '4m ago' },
];

const holderBands = [
  { label: 'Top holder', value: '6.4%' },
  { label: 'Top 10 holders', value: '28.7%' },
  { label: 'Creator allocation', value: '5.0%' },
  { label: 'Graduation target', value: '80.0%' },
];

const QUICK_AMOUNTS = [50, 250, 1000] as const;

function formatAddress(address?: string) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortenHash(hash?: string) {
  if (!hash) return null;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function isHexAddress(value?: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? '');
}

export default function TokenDetailPage({ params }: { params: { address: string } }) {
  const routeAddress = params?.address;
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [tradeIntent, setTradeIntent] = useState<'buy' | 'sell'>('buy');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const { address: walletAddress, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();

  const routeContractAddress = isHexAddress(routeAddress) ? routeAddress : undefined;
  const tokenFactoryAddress = isHexAddress(CONTRACTS.TOKEN_FACTORY)
    ? (CONTRACTS.TOKEN_FACTORY as `0x${string}`)
    : undefined;
  const usdcAddress = isHexAddress(CONTRACTS.USDC)
    ? (CONTRACTS.USDC as `0x${string}`)
    : undefined;

  const { data: isArcTokenData, isLoading: isResolvingRoute } = useReadContract({
    address: tokenFactoryAddress,
    abi: ArcTokenFactoryABI,
    functionName: 'isArcToken',
    args: routeContractAddress ? [routeContractAddress] : undefined,
    query: {
      enabled: Boolean(tokenFactoryAddress && routeContractAddress),
    },
  });

  const isTokenRoute = Boolean(isArcTokenData);
  const tokenAddress = isTokenRoute ? routeContractAddress : undefined;

  const { data: tokenAmmData, isLoading: isResolvingAmm } = useReadContract({
    address: tokenFactoryAddress,
    abi: ArcTokenFactoryABI,
    functionName: 'getTokenAMM',
    args: routeContractAddress ? [routeContractAddress] : undefined,
    query: {
      enabled: Boolean(tokenFactoryAddress && routeContractAddress && isTokenRoute),
    },
  });

  const resolvedMarketAddress =
    typeof tokenAmmData === 'string' &&
    isHexAddress(tokenAmmData) &&
    tokenAmmData !== ZERO_ADDRESS
      ? tokenAmmData
      : routeContractAddress || '';

  const marketAddress = isTokenRoute ? (resolvedMarketAddress === routeContractAddress ? '' : resolvedMarketAddress) : resolvedMarketAddress;
  const routeResolved = Boolean(marketAddress) && (!isResolvingRoute && (!isTokenRoute || !isResolvingAmm));
  const routeMode = isTokenRoute ? 'Token route resolved to AMM' : 'Direct AMM route';

  const shortAddress = routeAddress ? `${routeAddress.slice(0, 6)}…${routeAddress.slice(-4)}` : 'Unknown market';
  const marketShortAddress = marketAddress ? `${marketAddress.slice(0, 6)}…${marketAddress.slice(-4)}` : 'Resolving...';
  const symbolSeed = routeAddress ? routeAddress.slice(2, 6).toUpperCase() || 'ARC' : 'ARC';
  const projectName = `ARC ${symbolSeed}`;

  const buyAmount = selectedAmount.toString();
  const sellAmount = selectedAmount.toString();
  const requiredUsdcAmount = BigInt(selectedAmount * 1_000_000);
  const requiredSellAmount = parseEther(sellAmount);

  const projectedBuy = useCalculateBuyReturn(routeResolved ? marketAddress : '', buyAmount);
  const projectedSell = useCalculateSellReturn(routeResolved ? marketAddress : '', sellAmount);
  const currentPrice = useCurrentPrice(routeResolved ? marketAddress : '');
  const graduation = useGraduationProgress(routeResolved ? marketAddress : '');

  const transactionData = useMemo(
    () => ({
      from: walletAddress || ZERO_ADDRESS,
      to: marketAddress || ZERO_ADDRESS,
      value: '0x0',
      data: tradeIntent === 'buy' ? '0xbuytokens' : '0xselltokens',
    }),
    [marketAddress, tradeIntent, walletAddress]
  );

  const usdcBalance = useArcUSDCBalance(walletAddress, {
    enabled: Boolean(walletAddress),
    refreshInterval: 15000,
  });
  const nativeBalance = useArcNativeBalance(walletAddress, {
    enabled: Boolean(walletAddress),
    refreshInterval: 15000,
  });
  const sufficientBalance = useArcSufficientBalance(walletAddress, requiredUsdcAmount);
  const gasWithBuffer = useArcGasWithBuffer(transactionData, 20);

  const approval = useApproveAMMUSDC(routeResolved ? marketAddress : '');
  const buy = useBuyTokens(routeResolved ? marketAddress : '');
  const sell = useSellTokens(routeResolved ? marketAddress : '');

  const { data: allowanceData, isLoading: isCheckingAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: walletAddress && routeResolved ? [walletAddress as `0x${string}`, marketAddress as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(usdcAddress && walletAddress && routeResolved && tradeIntent === 'buy'),
    },
  });

  const { data: sellAllowanceData, isLoading: isCheckingSellAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: walletAddress && tokenAddress && routeResolved ? [walletAddress as `0x${string}`, marketAddress as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(tokenAddress && walletAddress && routeResolved && tradeIntent === 'sell'),
    },
  });

  const {
    writeContract: approveSellToken,
    data: sellApprovalHash,
    isPending: isSellApprovalPending,
    error: sellApprovalError,
  } = useWriteContract();
  const { isLoading: isSellApprovalConfirming, isSuccess: isSellApprovalSuccess } = useWaitForTransactionReceipt({
    hash: sellApprovalHash,
  });

  const buyAllowance = (allowanceData as bigint | undefined) ?? 0n;
  const buyApprovalRequired = tradeIntent === 'buy' && buyAllowance < requiredUsdcAmount;
  const buyAllowanceFormatted = tradeIntent === 'buy' ? formatUnits(buyAllowance, 6) : '0';

  const sellAllowance = (sellAllowanceData as bigint | undefined) ?? 0n;
  const sellApprovalSupported = Boolean(tokenAddress);
  const sellApprovalRequired = tradeIntent === 'sell' && sellApprovalSupported && sellAllowance < requiredSellAmount;
  const sellAllowanceFormatted = tradeIntent === 'sell' && sellApprovalSupported ? formatUnits(sellAllowance, 18) : '0';

  useEffect(() => {
    setTradeStatus(null);
  }, [selectedAmount, tradeIntent, walletAddress, marketAddress]);

  useEffect(() => {
    if (approval.isSuccess) {
      setTradeStatus(`USDC approval confirmed for ${buyAmount} on ${marketShortAddress}.`);
    }
  }, [approval.isSuccess, marketShortAddress, buyAmount]);

  useEffect(() => {
    if (isSellApprovalSuccess) {
      setTradeStatus(`Sell approval confirmed for ${sellAmount} ${symbolSeed} on ${marketShortAddress}.`);
    }
  }, [isSellApprovalSuccess, marketShortAddress, sellAmount, symbolSeed]);

  useEffect(() => {
    if (buy.isSuccess) {
      setTradeStatus(`Buy transaction submitted: ${shortenHash(buy.txHash) || 'pending confirmation'}.`);
    }
  }, [buy.isSuccess, buy.txHash]);

  useEffect(() => {
    if (sell.isSuccess) {
      setTradeStatus(`Sell transaction submitted: ${shortenHash(sell.txHash) || 'pending confirmation'}.`);
    }
  }, [sell.isSuccess, sell.txHash]);

  const connectWallet = async () => {
    if (!connectors.length) {
      setWalletError('No wallet connector is available in this environment.');
      return;
    }

    setWalletError(null);
    try {
      await connectAsync({ connector: connectors[0] });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletError(error instanceof Error ? error.message : 'Wallet connection failed.');
    }
  };

  const handleApprove = async () => {
    if (!routeResolved) {
      setTradeStatus('Market route is still resolving. Wait for the AMM address before approving.');
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!usdcAddress) {
      setWalletError('USDC contract address is not configured.');
      return;
    }

    approval.approve(buyAmount);
    setTradeStatus(`Approval requested for ${buyAmount} USDC.`);
  };

  const handleApproveSell = async () => {
    if (!routeResolved) {
      setTradeStatus('Market route is still resolving. Wait for the AMM address before approving sell tokens.');
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!tokenAddress) {
      setTradeStatus('Sell approval is only supported when this page is opened from a token route.');
      return;
    }

    approveSellToken({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [marketAddress as `0x${string}`, requiredSellAmount],
    });
    setTradeStatus(`Approval requested for ${sellAmount} ${symbolSeed}.`);
  };

  const handleExecute = async (intent: 'buy' | 'sell') => {
    setTradeIntent(intent);
    setWalletError(null);

    if (!routeResolved) {
      setTradeStatus('Market route is still resolving. Wait for the AMM address before trading.');
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (intent === 'buy') {
      if (!sufficientBalance.hasSufficientBalance) {
        setTradeStatus(`Insufficient USDC. Add ${sufficientBalance.shortfallFormatted} more to continue.`);
        return;
      }
      if (buyApprovalRequired) {
        setTradeStatus('Approve USDC first, then execute the buy transaction.');
        return;
      }
      buy.buyTokens(buyAmount, 0n);
      setTradeStatus(`Submitting buy for ${buyAmount} USDC.`);
      return;
    }

    if (sellApprovalRequired) {
      setTradeStatus('Approve the token first, then execute the sell transaction.');
      return;
    }

    sell.sellTokens(sellAmount, 0n);
    setTradeStatus(`Submitting sell for ${sellAmount} ${symbolSeed}.`);
  };

  const projectedReceive = tradeIntent === 'buy'
    ? projectedBuy.tokensOutFormatted || '0'
    : projectedSell.usdcOutFormatted || '0';
  const projectedFee = tradeIntent === 'buy'
    ? projectedBuy.feeFormatted || '0'
    : projectedSell.feeFormatted || '0';

  if (!routeAddress) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <div className="text-xl font-semibold text-neutral-900 dark:text-white">Token market missing</div>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">Open this page from the launch feed or explore page with a valid market route.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/explore" className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
              Explore tokens
            </Link>
            <Link href="/launch" className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
              Launch a token
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
      <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
              <Rocket className="h-3.5 w-3.5" />
              Live launch market
            </div>
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                {symbolSeed.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white lg:text-4xl">{projectName}</h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    ${symbolSeed}
                  </span>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                    {graduation.progressPercent >= 100 ? 'Graduated' : 'Bonding curve active'}
                  </span>
                </div>
                <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
                  A trader-facing token page designed for immediate action: live price reads, resolved AMM routing, exact approval checks, and buy or sell execution from one surface.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Badge icon={<Wallet className="h-3.5 w-3.5" />}>{shortAddress}</Badge>
                  <Badge icon={<Shield className="h-3.5 w-3.5" />}>{routeResolved ? routeMode : 'Resolving route'}</Badge>
                  <Badge icon={<Globe className="h-3.5 w-3.5" />}>{marketShortAddress}</Badge>
                  <Badge icon={<TrendingUp className="h-3.5 w-3.5" />}>{isConnected ? `Wallet ${formatAddress(walletAddress)}` : 'Connect wallet for trading'}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    Browse token markets
                  </Link>
                  <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                    Launch another token
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/90 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Curve completion</span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {graduation.isLoading ? 'Loading...' : `${graduation.progressPercent.toFixed(1)}%`}
              </span>
            </div>
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" style={{ width: `${Math.min(graduation.progressPercent || 0, 100)}%` }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <HeroMetric label="Current price" value={currentPrice.isLoading ? 'Loading...' : `$${currentPrice.priceFormatted}`} hint="Live AMM read" />
              <HeroMetric label="Resolved market" value={marketShortAddress} hint={routeResolved ? routeMode : 'Waiting on route resolution'} />
              <HeroMetric label="Trade mode" value={tradeIntent === 'buy' ? 'Buy path' : 'Sell path'} hint="Switches execution and quotes" />
              <HeroMetric label="Connected wallet" value={isConnected ? formatAddress(walletAddress) : 'Not connected'} hint="Required for writes" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Market snapshot</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <BarChart3 className="h-3.5 w-3.5" />
                On-chain aware
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SnapshotCard title="Current price" value={currentPrice.isLoading ? 'Loading...' : `$${currentPrice.priceFormatted}`} delta="Pulled from AMM" />
              <SnapshotCard title="Projected fee" value={`${projectedFee} USDC`} delta={tradeIntent === 'buy' ? 'Buy quote' : 'Sell quote'} />
              <SnapshotCard title="Graduation" value={graduation.isLoading ? 'Loading...' : `${graduation.progressPercent.toFixed(1)}%`} delta="Live progress" />
              <SnapshotCard title="Allowance" value={tradeIntent === 'buy' ? `${buyAllowanceFormatted} USDC` : sellApprovalSupported ? `${sellAllowanceFormatted} ${symbolSeed}` : 'Token route needed'} delta={tradeIntent === 'buy' ? (isCheckingAllowance ? 'Checking approval' : buyApprovalRequired ? 'Approval required' : 'Ready to buy') : sellApprovalSupported ? (isCheckingSellAllowance ? 'Checking approval' : sellApprovalRequired ? 'Approval required' : 'Ready to sell') : 'Direct AMM route'} />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent trades</h2>
              <Link href="/stats" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Full analytics
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-slate-950/60 dark:text-neutral-400">
                <span>Wallet</span>
                <span>Side</span>
                <span>Value</span>
                <span>Time</span>
              </div>
              {demoTrades.map((trade) => (
                <div key={`${trade.wallet}-${trade.age}`} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] items-center border-t border-neutral-200 px-4 py-3 text-sm dark:border-white/10">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">{trade.wallet}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{trade.tokens} tokens</div>
                  </div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trade.side === 'Buy' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                      {trade.side}
                    </span>
                  </div>
                  <div className="font-semibold text-neutral-900 dark:text-white">{trade.amount}</div>
                  <div className="text-neutral-500 dark:text-neutral-400">{trade.age}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Creator and trust signals</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <Shield className="h-3.5 w-3.5" />
                Social-first launch
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">Creator profile</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">0xA9d3…be27</div>
                <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center justify-between"><span>Past launches</span><span className="font-medium text-neutral-900 dark:text-white">4</span></div>
                  <div className="flex items-center justify-between"><span>Graduated</span><span className="font-medium text-neutral-900 dark:text-white">3</span></div>
                  <div className="flex items-center justify-between"><span>Repeat traders</span><span className="font-medium text-neutral-900 dark:text-white">38%</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Execution path</div>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Buy flow now resolves token routes into AMM routes, checks live USDC allowance, then gates approval only when it is actually needed.</p>
                  <p>Sell flow now also reads token allowance when the route is token-native and asks for approval before execution only when the position requires it.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Trade panel</h2>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                Resolved routing + allowance
              </span>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Wallet</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{isConnected ? formatAddress(walletAddress) : 'Not connected'}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <WalletMetric label="USDC balance" value={isConnected ? (usdcBalance.loading ? 'Loading...' : `${usdcBalance.formatted} USDC`) : 'Connect wallet'} />
                  <WalletMetric label="Native balance" value={isConnected ? (nativeBalance.loading ? 'Loading...' : `${nativeBalance.formatted} ARC`) : 'Connect wallet'} />
                </div>
                {!isConnected && (
                  <button onClick={connectWallet} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={isConnecting}>
                    <Wallet className="h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect wallet'}
                  </button>
                )}
                {walletError && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{walletError}</div>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={selectedAmount === amount ? 'rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300' : 'rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200'}
                  >
                    {tradeIntent === 'buy' ? `$${amount}` : `${amount} ${symbolSeed}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTradeIntent('buy')} className={tradeIntent === 'buy' ? 'rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black' : 'rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200'}>
                  Buy
                </button>
                <button onClick={() => setTradeIntent('sell')} className={tradeIntent === 'sell' ? 'rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black' : 'rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200'}>
                  Sell
                </button>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Resolved market</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{marketShortAddress}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Trade size</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{tradeIntent === 'buy' ? `$${selectedAmount} USDC` : `${selectedAmount} ${symbolSeed}`}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Projected receive</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{tradeIntent === 'buy' ? `${projectedReceive} ${symbolSeed}` : `$${projectedReceive} USDC`}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Buffered gas</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{gasWithBuffer.loading ? 'Estimating...' : gasWithBuffer.gasEstimate?.gasCostFormatted || 'Unavailable'}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Balance check</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {tradeIntent === 'sell'
                      ? isConnected ? 'Wallet connected' : 'Wallet needed'
                      : !isConnected
                        ? 'Wallet needed'
                        : sufficientBalance.loading
                          ? 'Checking...'
                          : sufficientBalance.hasSufficientBalance
                            ? 'Ready'
                            : `Short ${sufficientBalance.shortfallFormatted}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Approval state</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {tradeIntent === 'buy'
                      ? isCheckingAllowance
                        ? 'Checking allowance'
                        : buyApprovalRequired
                          ? 'Approval required'
                          : 'Ready to buy'
                      : !sellApprovalSupported
                        ? 'Token route needed'
                        : isCheckingSellAllowance
                          ? 'Checking allowance'
                          : sellApprovalRequired
                            ? 'Approval required'
                            : 'Ready to sell'}
                  </span>
                </div>
              </div>

              {(tradeStatus || buy.error || sell.error || sellApprovalError) && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  {tradeStatus || buy.error?.message || sell.error?.message || sellApprovalError?.message}
                </div>
              )}

              {tradeIntent === 'buy' && buyApprovalRequired && (
                <button onClick={handleApprove} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/60 dark:text-white" disabled={approval.isLoading || !routeResolved}>
                  <Shield className="h-5 w-5" />
                  {approval.isLoading ? 'Approving USDC...' : 'Approve USDC'}
                </button>
              )}

              {tradeIntent === 'sell' && sellApprovalRequired && (
                <button onClick={handleApproveSell} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/60 dark:text-white" disabled={(isSellApprovalPending || isSellApprovalConfirming) || !routeResolved}>
                  <Shield className="h-5 w-5" />
                  {isSellApprovalPending || isSellApprovalConfirming ? 'Approving token...' : `Approve ${symbolSeed}`}
                </button>
              )}

              <button onClick={() => handleExecute(tradeIntent)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={buy.isLoading || sell.isLoading || approval.isLoading || isSellApprovalPending || isSellApprovalConfirming || !routeResolved}>
                {tradeIntent === 'buy' ? <TrendingUp className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                {tradeIntent === 'buy'
                  ? buy.isLoading ? 'Buying...' : 'Execute buy'
                  : sell.isLoading ? 'Selling...' : 'Execute sell'}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">Distribution risk view</h2>
            <div className="space-y-3">
              {holderBands.map((row) => (
                <div key={row.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{row.label}</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Community pulse</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <MessageSquare className="h-3.5 w-3.5" />
                Social hooks next
              </span>
            </div>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <CommunityRow author="0x22aa…71d0" text="Clean launch, curve feels fair so far." />
              <CommunityRow author="0x7b19…c014" text="Watching for graduation tonight." />
              <CommunityRow author="0x0f44…90c9" text="Creator shipped links and docs fast, bullish." />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <Clock3 className="h-4 w-4" />
              Build sequence
            </div>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <li>1. Replace community placeholders with real comments and creator updates.</li>
              <li>2. Route post-launch success screens directly into this market execution path.</li>
              <li>3. Backfill live feed data and token metadata from indexed entities.</li>
              <li>4. Add reverse lookup support for direct AMM routes so sell-side token approvals can always be resolved.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function SnapshotCard({ title, value, delta }: { title: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{delta}</div>
    </div>
  );
}

function Badge({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 dark:border-white/10 dark:bg-slate-950/60">
      {icon}
      {children}
    </span>
  );
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/80">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}

function CommunityRow({ author, text }: { author: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{author}</div>
      <div>{text}</div>
    </div>
  );
}
