/**
 * Graduation Banner
 *
 * Post-graduation UI: staking, rewards claiming, creator reserve withdrawal.
 */

'use client';

import { useState } from 'react';
import { Award, Coins, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useStakeTokens,
  useUnstakeTokens,
  useClaimRewards,
  useClaimableRewards,
  useUserStake,
  useStakingPoolStats,
  useCreatorReserve,
  useWithdrawCreatorReserve,
} from '@/hooks/useTokenStaking';

interface GraduationBannerProps {
  ammAddress: string;
  creatorAddress: string;
  userAddress: string;
}

export function GraduationBanner({ ammAddress, creatorAddress, userAddress }: GraduationBannerProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');

  const isCreator = userAddress.toLowerCase() === creatorAddress.toLowerCase();

  const { claimableFormatted } = useClaimableRewards(ammAddress, userAddress);
  const { stakedFormatted } = useUserStake(ammAddress, userAddress);
  const { totalStakedFormatted, poolRemainingFormatted } = useStakingPoolStats(ammAddress);
  const { reserveFormatted } = useCreatorReserve(ammAddress);

  const { stakeTokens, isLoading: isStaking } = useStakeTokens(ammAddress);
  const { unstakeTokens, isLoading: isUnstaking } = useUnstakeTokens(ammAddress);
  const { claimRewards, isLoading: isClaiming } = useClaimRewards(ammAddress);
  const { withdraw, isLoading: isWithdrawing } = useWithdrawCreatorReserve(ammAddress);

  return (
    <div className="mb-8 space-y-4">
      {/* Graduation Header */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <h2 className="font-bold text-green-900 dark:text-green-200">Token Graduated</h2>
            <p className="text-sm text-green-700 dark:text-green-300">
              Trading is closed. Stake tokens to earn USDC rewards over 365 days.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Staking Panel */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            <Coins className="h-4 w-4" /> Staking Rewards
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Your Stake</span>
              <span className="font-medium text-neutral-900 dark:text-white">{Number(stakedFormatted).toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Claimable</span>
              <span className="font-medium text-green-600">${claimableFormatted} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Staked</span>
              <span className="text-neutral-700 dark:text-neutral-300">{Number(totalStakedFormatted).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Pool Remaining</span>
              <span className="text-neutral-700 dark:text-neutral-300">${poolRemainingFormatted}</span>
            </div>
          </div>

          {/* Claim Button */}
          {parseFloat(claimableFormatted) > 0 && (
            <Button
              onClick={() => claimRewards()}
              disabled={isClaiming}
              isLoading={isClaiming}
              fullWidth
              size="sm"
              className="mt-3 bg-green-600 hover:bg-green-700"
            >
              Claim ${claimableFormatted} USDC
            </Button>
          )}

          {/* Stake Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount to stake"
              className="input flex-1 text-sm"
            />
            <Button
              onClick={() => { if (stakeAmount) stakeTokens(stakeAmount); }}
              disabled={isStaking || !stakeAmount}
              isLoading={isStaking}
              size="sm"
            >
              Stake
            </Button>
          </div>

          {/* Unstake Input */}
          {parseFloat(stakedFormatted) > 0 && (
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="Amount to unstake"
                className="input flex-1 text-sm"
              />
              <Button
                onClick={() => { if (unstakeAmount) unstakeTokens(unstakeAmount); }}
                disabled={isUnstaking || !unstakeAmount}
                isLoading={isUnstaking}
                variant="secondary"
                size="sm"
              >
                Unstake
              </Button>
            </div>
          )}
        </div>

        {/* Creator Reserve Panel (only for creator) */}
        {isCreator && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
              <Lock className="h-4 w-4" /> Creator Treasury
            </h3>

            <div className="text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Available</span>
                <span className="font-medium text-neutral-900 dark:text-white">${reserveFormatted} USDC</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="USDC amount"
                className="input text-sm"
              />
              <input
                type="text"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Reason (e.g., development, marketing)"
                className="input text-sm"
              />
              <Button
                onClick={() => {
                  if (withdrawAmount && withdrawReason) {
                    withdraw(withdrawAmount, withdrawReason);
                  }
                }}
                disabled={isWithdrawing || !withdrawAmount || !withdrawReason}
                isLoading={isWithdrawing}
                fullWidth
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
              >
                Withdraw
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
