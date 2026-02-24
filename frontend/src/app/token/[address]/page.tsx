/**
 * Token Detail Page
 *
 * Shows bonding curve token info, buy/sell panels, graduation status,
 * and post-graduation staking UI.
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Award, Lock } from 'lucide-react';
import { useTokenConfig, useTokenAMM } from '@/hooks/useTokenFactory';
import { useCurrentPrice, useIsGraduated, useGraduationProgress, useAMMStats } from '@/hooks/useTokenAMM';
import { useTokenRisk } from '@/hooks/useTokenRisk';
import { BuyTokenPanel } from '@/components/token/BuyTokenPanel';
import { SellTokenPanel } from '@/components/token/SellTokenPanel';
import { GraduationBanner } from '@/components/token/GraduationBanner';
import { RiskBadge } from '@/components/token/RiskBadge';
import { CURVE_TYPE_NAMES } from '@/lib/contracts';
import { truncateAddress } from '@/lib/utils';

export default function TokenDetailPage() {
  const params = useParams();
  const tokenAddress = params.address as string;
  const { address: userAddress } = useAccount();

  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Data hooks
  const { config, isLoading: configLoading } = useTokenConfig(tokenAddress);
  const { ammAddress } = useTokenAMM(tokenAddress);
  const { priceFormatted, refetch: refetchPrice } = useCurrentPrice(ammAddress || '');
  const { isGraduated } = useIsGraduated(ammAddress || '');
  const { progressPercent } = useGraduationProgress(ammAddress || '');
  const {
    currentSupplyFormatted,
    totalVolumeFormatted,
    reserveFormatted,
  } = useAMMStats(ammAddress || '');
  const { risk } = useTokenRisk(tokenAddress);

  if (configLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 rounded mx-auto dark:bg-neutral-700" />
          <div className="h-4 w-32 bg-neutral-200 rounded mx-auto dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Token not found</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">This token address is not registered in the factory.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Graduation Banner */}
      {isGraduated && ammAddress && (
        <GraduationBanner ammAddress={ammAddress} creatorAddress={config.creator} userAddress={userAddress || ''} />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Token Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {config.imageUrl && (
              <img
                src={config.imageUrl}
                alt={config.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{config.name}</h1>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  ${config.symbol}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Created by {truncateAddress(config.creator)} &middot; {CURVE_TYPE_NAMES[config.curveType]} curve
              </p>
              {config.description && (
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">{config.description}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Price" value={`$${priceFormatted}`} icon={TrendingUp} />
            <StatCard label="Supply Sold" value={Number(currentSupplyFormatted).toLocaleString()} icon={ArrowUpRight} />
            <StatCard label="Volume" value={`$${Number(totalVolumeFormatted).toLocaleString()}`} icon={ArrowDownRight} />
            <StatCard label="Reserves" value={`$${Number(reserveFormatted).toLocaleString()}`} icon={Lock} />
          </div>

          {/* Graduation Progress */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Graduation Progress
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className={`h-full rounded-full transition-all ${
                  isGraduated
                    ? 'bg-green-500'
                    : progressPercent > 50
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-neutral-500">
              <span>0%</span>
              <span>80% = Graduation</span>
              <span>100%</span>
            </div>
          </div>

          {/* Token Details */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Token Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-neutral-500">Contract</dt>
                <dd className="font-mono text-neutral-900 dark:text-white">{truncateAddress(tokenAddress)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">AMM</dt>
                <dd className="font-mono text-neutral-900 dark:text-white">{ammAddress ? truncateAddress(ammAddress) : '-'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Total Supply</dt>
                <dd className="text-neutral-900 dark:text-white">{Number(formatEther(config.totalSupply)).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Base Price</dt>
                <dd className="text-neutral-900 dark:text-white">${(Number(config.basePrice) / 1e6).toFixed(6)} USDC</dd>
              </div>
            </dl>
          </div>

          {/* Risk Assessment */}
          {risk && <RiskBadge risk={risk} />}
        </div>

        {/* Right: Buy/Sell Panel */}
        <div className="space-y-6">
          {!isGraduated && ammAddress ? (
            <>
              {/* Tab Switcher */}
              <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400'
                  }`}
                >
                  Sell
                </button>
              </div>

              {activeTab === 'buy' ? (
                <BuyTokenPanel
                  ammAddress={ammAddress}
                  tokenSymbol={config.symbol}
                  onSuccess={refetchPrice}
                />
              ) : (
                <SellTokenPanel
                  ammAddress={ammAddress}
                  tokenAddress={tokenAddress}
                  tokenSymbol={config.symbol}
                  onSuccess={refetchPrice}
                />
              )}
            </>
          ) : isGraduated ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
              <Award className="mx-auto h-10 w-10 text-green-600 dark:text-green-400 mb-3" />
              <p className="font-semibold text-green-900 dark:text-green-200">Token Graduated</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Trading is closed. Stake tokens to earn USDC rewards.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-neutral-500">Loading AMM...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <Icon className="h-4 w-4 text-neutral-400 mb-1" />
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-bold text-neutral-900 dark:text-white truncate">{value}</p>
    </div>
  );
}
