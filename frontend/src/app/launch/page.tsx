/**
 * Token Launch Page
 *
 * Form for creating new tokens via ArcTokenFactory.
 * Includes USDC approval flow and staker discount display.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Rocket, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useCreateToken, useApproveFactoryUSDC, useCreationFee } from '@/hooks/useTokenFactory';
import { useUSDCBalance } from '@/hooks/useMarketplace';
import { CurveType, CURVE_TYPE_NAMES } from '@/lib/contracts';
import { formatUSDC } from '@/lib/utils';

export default function LaunchPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [basePrice, setBasePrice] = useState('0.01');
  const [slope, setSlope] = useState('1');
  const [curveType, setCurveType] = useState<number>(CurveType.LINEAR);

  // UI state
  const [step, setStep] = useState<'form' | 'approving' | 'creating' | 'success' | 'error'>('form');
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { fee, feeFormatted } = useCreationFee();
  const { balance, balanceFormatted } = useUSDCBalance(address || '');
  const {
    approve,
    isLoading: isApproving,
    isSuccess: isApproved,
  } = useApproveFactoryUSDC();
  const {
    createToken,
    isLoading: isCreating,
    isSuccess: isCreated,
    error: createError,
    txHash,
  } = useCreateToken();

  const hasInsufficientBalance = fee && balance ? balance < fee : false;

  // Handle approval completion
  useEffect(() => {
    if (isApproved && step === 'approving') {
      setStep('creating');
      createToken({
        name,
        symbol,
        description,
        imageUrl,
        totalSupply,
        basePrice,
        slope,
        curveType,
      });
    }
  }, [isApproved, step]);

  // Handle creation completion
  useEffect(() => {
    if (isCreated) {
      setStep('success');
    }
  }, [isCreated]);

  // Handle errors
  useEffect(() => {
    if (createError) {
      setStep('error');
      setError(createError.message);
    }
  }, [createError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim() || name.length > 50) {
      setError('Name is required (max 50 characters)');
      return;
    }
    if (!symbol.trim() || symbol.length > 10) {
      setError('Symbol is required (max 10 characters)');
      return;
    }
    if (parseFloat(totalSupply) < 1 || parseFloat(totalSupply) > 1e12) {
      setError('Total supply must be between 1 and 1 trillion');
      return;
    }
    if (parseFloat(basePrice) <= 0) {
      setError('Base price must be greater than 0');
      return;
    }

    // Start approval flow
    setStep('approving');
    approve(feeFormatted);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Rocket className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Launch a Token</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Connect your wallet to create a token with a bonding curve.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Launch a Token</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create an ERC20 token with an automated bonding curve. Tokens graduate at 80% supply sold.
        </p>
      </div>

      {/* Success State */}
      {step === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-green-900 mb-2">Token Launched!</h2>
          <p className="text-green-700 mb-4">Your token has been created with a bonding curve AMM.</p>
          <button
            onClick={() => router.push('/explore')}
            className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            View All Tokens
          </button>
        </div>
      )}

      {/* Form */}
      {step !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Details */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Token Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Token"
                    maxLength={50}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Symbol *</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="MTK"
                    maxLength={10}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this token about?"
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/token-image.png"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tokenomics */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Tokenomics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Total Supply</label>
                <input
                  type="number"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  min="1"
                  max="1000000000000"
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-neutral-500">Graduation at 80% supply sold ({(parseFloat(totalSupply || '0') * 0.8).toLocaleString()} tokens)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Base Price (USDC)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    step="0.000001"
                    min="0.000001"
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Starting price per token</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Slope</label>
                  <input
                    type="number"
                    value={slope}
                    onChange={(e) => setSlope(e.target.value)}
                    step="0.1"
                    min="0"
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Price increase rate</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Curve Type</label>
                <div className="flex gap-3">
                  {CURVE_TYPE_NAMES.map((typeName, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurveType(i)}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                        curveType === i
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {typeName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fee Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-200">Creation Fee: ${feeFormatted} USDC</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Stakers receive up to 50% discount. Your balance: ${balanceFormatted} USDC
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Graduation model: 50% Creator Treasury / 25% Staking Rewards / 25% Platform
                </p>
              </div>
            </div>
          </div>

          {/* Insufficient Balance */}
          {hasInsufficientBalance && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Insufficient USDC balance for creation fee</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && step === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              hasInsufficientBalance ||
              isApproving ||
              isCreating ||
              !name.trim() ||
              !symbol.trim()
            }
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Approving USDC...
              </>
            ) : isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Token...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                Launch Token (${feeFormatted} USDC)
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
