/**
 * Buy Token Panel
 *
 * USDC-to-token buy form with approval, slippage preview, and fee display.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CheckCircle2 } from 'lucide-react';
import { useBuyTokens, useApproveAMMUSDC, useCalculateBuyReturn } from '@/hooks/useTokenAMM';
import { useUSDCBalance } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/Button';
import { InlineError } from '@/components/ui/ErrorDisplay';
import { parseUSDC } from '@/lib/utils';

interface BuyTokenPanelProps {
  ammAddress: string;
  tokenSymbol: string;
  onSuccess?: () => void;
}

export function BuyTokenPanel({ ammAddress, tokenSymbol, onSuccess }: BuyTokenPanelProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approving' | 'buying' | 'success' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);

  const { balance, balanceFormatted } = useUSDCBalance(address || '');
  const { tokensOutFormatted, feeFormatted, isLoading: isCalculating } = useCalculateBuyReturn(ammAddress, amount);
  const { approve, isLoading: isApproving, isSuccess: isApproved } = useApproveAMMUSDC(ammAddress);
  const { buyTokens, isLoading: isBuying, isSuccess: isBought, error: buyError } = useBuyTokens(ammAddress);

  const parsedAmount = amount ? parseUSDC(amount) : 0n;
  const hasInsufficientBalance = balance !== undefined && parsedAmount > balance;

  // Handle approval -> buy flow
  useEffect(() => {
    if (isApproved && step === 'approving') {
      setStep('buying');
      buyTokens(amount);
    }
  }, [isApproved, step]);

  useEffect(() => {
    if (isBought) {
      setStep('success');
      setAmount('');
      onSuccess?.();
    }
  }, [isBought]);

  useEffect(() => {
    if (buyError) {
      setStep('error');
      setError(buyError.message);
    }
  }, [buyError]);

  const handleBuy = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setError(null);
    setStep('approving');
    approve(amount);
  };

  const quickAmounts = ['10', '50', '100', '500'];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Buy {tokenSymbol}</h3>

      {/* Amount Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">You pay (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStep('input'); }}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-lg font-medium dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-neutral-500">Balance: ${balanceFormatted}</span>
            <button
              onClick={() => setAmount(balanceFormatted)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Max
            </button>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="flex gap-2">
          {quickAmounts.map((qa) => (
            <button
              key={qa}
              onClick={() => { setAmount(qa); setStep('input'); }}
              className="flex-1 rounded border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">You receive</span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {isCalculating ? '...' : `${Number(tokensOutFormatted).toLocaleString()} ${tokenSymbol}`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Platform fee (2.5%)</span>
              <span>${feeFormatted} USDC</span>
            </div>
          </div>
        )}

        {/* Insufficient Balance */}
        {hasInsufficientBalance && (
          <InlineError message="Insufficient USDC balance" className="text-xs" />
        )}

        {/* Status Messages */}
        {step === 'success' && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Purchase successful!</span>
          </div>
        )}
        {step === 'error' && error && (
          <InlineError message={error.slice(0, 80)} className="text-xs" />
        )}

        {/* Buy Button */}
        <Button
          onClick={handleBuy}
          fullWidth
          disabled={
            !address ||
            !amount ||
            parseFloat(amount) <= 0 ||
            hasInsufficientBalance ||
            isApproving ||
            isBuying
          }
          isLoading={isApproving || isBuying}
          className="bg-green-600 hover:bg-green-700"
        >
          {isApproving ? 'Approving...' : isBuying ? 'Buying...' : `Buy ${tokenSymbol}`}
        </Button>
      </div>
    </div>
  );
}
