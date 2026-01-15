import { useState } from 'react';
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { useCircleWallet } from '@/providers/CircleWalletProvider';
import NFTMarketplaceABI from './abis/NFTMarketplace.json';
import ERC20ABI from './abis/ERC20.json';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

/**
 * Enhanced hook for buying NFTs with support for both traditional wallets and Circle wallets
 */
export function useBuyNFT() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { executeChallenge, activeWallet } = useCircleWallet();
  const { writeContract, data: hash } = useContractWrite();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /**
   * Buy NFT with either traditional wallet or Circle wallet
   * @param collection - NFT collection address
   * @param tokenId - Token ID
   * @param price - Price in USDC (with 6 decimals)
   * @param useCircle - Whether to use Circle wallet (default: false)
   */
  async function buyNFT(
    collection: string,
    tokenId: string,
    price: string,
    useCircle: boolean = false
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const priceInWei = parseUnits(price, 6);

      // Step 1: Approve USDC spending
      if (useCircle && activeWallet) {
        // Use Circle wallet for approval
        const approveData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, priceInWei],
        });

        const approveResponse = await fetch('/api/circle/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: activeWallet.id,
            to: USDC_ADDRESS,
            value: '0',
            data: approveData,
          }),
        });

        if (!approveResponse.ok) {
          throw new Error('Failed to create approval transaction');
        }

        const { challengeId: approveChallengeId } = await approveResponse.json();
        
        // Execute approval challenge
        const approveSuccess = await executeChallenge(approveChallengeId);
        if (!approveSuccess) {
          throw new Error('Approval transaction failed');
        }

        // Wait a bit for approval to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Buy the NFT
        const buyData = encodeFunctionData({
          abi: NFTMarketplaceABI,
          functionName: 'buyItem',
          args: [collection as `0x${string}`, BigInt(tokenId)],
        });

        const buyResponse = await fetch('/api/circle/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: activeWallet.id,
            to: MARKETPLACE_ADDRESS,
            value: '0',
            data: buyData,
          }),
        });

        if (!buyResponse.ok) {
          throw new Error('Failed to create buy transaction');
        }

        const { challengeId: buyChallengeId } = await buyResponse.json();
        
        // Execute buy challenge
        const buySuccess = await executeChallenge(buyChallengeId);
        if (!buySuccess) {
          throw new Error('Buy transaction failed');
        }

        return true;
      } else {
        // Use traditional wallet (MetaMask) via wagmi
        
        // Step 1: Approve USDC
        await writeContract({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, priceInWei],
        });

        // Wait for approval confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Buy NFT
        await writeContract({
          address: MARKETPLACE_ADDRESS,
          abi: NFTMarketplaceABI,
          functionName: 'buyItem',
          args: [collection as `0x${string}`, BigInt(tokenId)],
        });

        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      console.error('Buy NFT error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    buyNFT,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Helper hook for USDC approval only
 */
export function useApproveUSDC() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { executeChallenge, activeWallet } = useCircleWallet();
  const { writeContract, data: hash } = useContractWrite();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function approve(amount: string, useCircle: boolean = false) {
    setIsLoading(true);
    setError(null);

    try {
      const amountInWei = parseUnits(amount, 6);

      if (useCircle && activeWallet) {
        const approveData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, amountInWei],
        });

        const response = await fetch('/api/circle/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: activeWallet.id,
            to: USDC_ADDRESS,
            value: '0',
            data: approveData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create approval transaction');
        }

        const { challengeId } = await response.json();
        const success = await executeChallenge(challengeId);
        
        if (!success) {
          throw new Error('Approval transaction failed');
        }

        return true;
      } else {
        await writeContract({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, amountInWei],
        });

        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Approval failed');
      console.error('Approve USDC error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    approve,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
