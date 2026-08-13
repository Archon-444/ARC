'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineError } from '@/components/ui/ErrorDisplay';
import { useCreatorFees } from '@/hooks/useTokenAMM';

interface CreatorFeesPanelProps {
  ammAddress: string;
}

export function CreatorFeesPanel({ ammAddress }: CreatorFeesPanelProps) {
  const { address } = useAccount();
  const {
    accruedFormatted,
    accrued,
    tokenCreator,
    withdrawCreatorFees,
    isLoading,
    isSuccess,
    error,
    refetchAccrued,
  } = useCreatorFees(ammAddress);

  useEffect(() => {
    if (isSuccess) {
      void refetchAccrued();
    }
  }, [isSuccess, refetchAccrued]);

  if (!ammAddress) return null;

  const isCreator =
    Boolean(address && tokenCreator) &&
    address!.toLowerCase() === tokenCreator!.toLowerCase();
  const hasAccrued = Boolean(accrued && accrued > 0n);

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <Coins className="h-4 w-4" />
            Creator paycheck
          </div>
          <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            2.5% fee on every trade — half to the creator, half to the platform. Creators collect here; a reverting wallet cannot brick the market.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Accrued</div>
          <div className="mt-1 font-semibold text-neutral-900 dark:text-white">${accruedFormatted} USDC</div>
        </div>
      </div>
      {isCreator && (
        <div className="mt-4">
          {error && <InlineError message={error.message.slice(0, 120)} className="mb-3 text-xs" />}
          <Button
            onClick={withdrawCreatorFees}
            disabled={!hasAccrued || isLoading}
            isLoading={isLoading}
          >
            {isSuccess ? 'Collected' : 'Collect creator fees'}
          </Button>
        </div>
      )}
    </div>
  );
}
