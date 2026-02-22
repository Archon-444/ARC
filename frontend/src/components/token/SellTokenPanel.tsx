/**
 * Sell Token Panel
 *
 * Token-to-USDC sell form with token approval and fee display.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSellTokens, useCalculateSellReturn } from '@/hooks/useTokenAMM';
import ERC20ABI from '@/hooks/abis/ERC20.json';

interface SellTokenPanelProps {
  ammAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  onSuccess?: () => void;
}

export function SellTokenPanel({ ammAddress, tokenAddress, tokenSymbol, onSuccess }: SellTokenPanelProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approving' | 'selling' | 'success' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);

  // Token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balance = tokenBalance as bigint | undefined;
  const balanceFormatted = balance ? formatEther(balance) : '0';
  const parsedAmount = amount ? parseEther(amount) : 0n;
  const hasInsufficientBalance = balance !== undefined && parsedAmount > balance;

  const { usdcOutFormatted, feeFormatted, isLoading: isCalculating } = useCalculateSellReturn(ammAddress, amount);

  // Approve token
  const { writeContract: approveToken, data: approveHash, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
  const isApproving = isApprovePending || isApproveConfirming;

  // Sell
  const { sellTokens, isLoading: isSelling, isSuccess: isSold, error: sellError } = useSellTokens(ammAddress);

  useEffect(() => {
    if (isApproved && step === 'approving') {
      setStep('selling');
      sellTokens(amount);
    }
  }, [isApproved, step]);

  useEffect(() => {
    if (isSold) {
      setStep('success');
      setAmount('');
      onSuccess?.();
    }
  }, [isSold]);

  useEffect(() => {
    if (sellError) {
      setStep('error');
      setError(sellError.message);
    }
  }, [sellError]);

  const handleSell = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setError(null);
    setStep('approving');
    approveToken({
      address: tokenAddress as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [ammAddress as `0x${string}`, parseEther(amount)],
    });
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Sell {tokenSymbol}</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">You sell ({tokenSymbol})</label>
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
            <span className="text-xs text-neutral-500">Balance: {Number(balanceFormatted).toLocaleString()} {tokenSymbol}</span>
            <button
              onClick={() => setAmount(balanceFormatted)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Max
            </button>
          </div>
        </div>

        {/* Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">You receive</span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {isCalculating ? '...' : `$${usdcOutFormatted} USDC`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Platform fee (2.5%)</span>
              <span>${feeFormatted} USDC</span>
            </div>
          </div>
        )}

        {hasInsufficientBalance && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Insufficient {tokenSymbol} balance</span>
          </div>
        )}

        {step === 'success' && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sale successful!</span>
          </div>
        )}
        {step === 'error' && error && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error.slice(0, 80)}</span>
          </div>
        )}

        <button
          onClick={handleSell}
          disabled={
            !address ||
            !amount ||
            parseFloat(amount) <= 0 ||
            hasInsufficientBalance ||
            isApproving ||
            isSelling
          }
          className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isApproving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Approving...</>
          ) : isSelling ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Selling...</>
          ) : (
            `Sell ${tokenSymbol}`
          )}
        </button>
      </div>
    </div>
  );
}
