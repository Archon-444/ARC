/**
 * Token Card Component
 *
 * Preview card for launched tokens, used in explore/tokens grid.
 */

'use client';

import Link from 'next/link';
import { TrendingUp, Award } from 'lucide-react';
import { useCurrentPrice, useGraduationProgress, useIsGraduated, useAMMStats } from '@/hooks/useTokenAMM';
import { useTokenConfig, useTokenAMM } from '@/hooks/useTokenFactory';
import { CURVE_TYPE_NAMES } from '@/lib/contracts';
import { truncateAddress } from '@/lib/utils';

interface TokenCardProps {
  tokenAddress: string;
}

export function TokenCard({ tokenAddress }: TokenCardProps) {
  const { config } = useTokenConfig(tokenAddress);
  const { ammAddress } = useTokenAMM(tokenAddress);
  const { priceFormatted } = useCurrentPrice(ammAddress || '');
  const { progressPercent } = useGraduationProgress(ammAddress || '');
  const { isGraduated } = useIsGraduated(ammAddress || '');
  const { totalVolumeFormatted } = useAMMStats(ammAddress || '');

  if (!config) return null;

  return (
    <Link
      href={`/token/${tokenAddress}`}
      className="group block rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-600"
    >
      <div className="flex items-start gap-3">
        {config.imageUrl ? (
          <img
            src={config.imageUrl}
            alt={config.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {config.symbol.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{config.name}</h3>
            {isGraduated && <Award className="h-4 w-4 text-green-500 flex-shrink-0" />}
          </div>
          <p className="text-sm text-neutral-500">${config.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-neutral-900 dark:text-white">${priceFormatted}</p>
          <p className="text-xs text-neutral-500">USDC</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full rounded-full ${isGraduated ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <span>{CURVE_TYPE_NAMES[config.curveType]}</span>
        <span>Vol: ${Number(totalVolumeFormatted).toLocaleString()}</span>
        <span>{isGraduated ? 'Graduated' : `${progressPercent.toFixed(0)}%`}</span>
      </div>
    </Link>
  );
}

/**
 * Token Grid for displaying multiple token cards
 */
export function TokenGrid({ tokens, isLoading }: { tokens: string[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-neutral-200 rounded dark:bg-neutral-700" />
                <div className="h-3 w-16 bg-neutral-200 rounded dark:bg-neutral-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="py-12 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-neutral-600 dark:text-neutral-400">No tokens launched yet.</p>
        <Link
          href="/launch"
          className="mt-3 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Be the first to launch a token
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tokens.map((addr) => (
        <TokenCard key={addr} tokenAddress={addr} />
      ))}
    </div>
  );
}
