/**
 * USDC Approval Component
 *
 * Handles USDC allowance checking and approval transactions
 * Used in Buy, Bid, and List flows
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn, formatUSDC, parseUSDC, getTransactionUrl } from '@/lib/utils';
import type { Address } from '@/types';

interface USDCApprovalProps {
  spender: Address;
  amount: string; // Amount in USDC string format (e.g., "100.50")
  onApprovalComplete?: () => void;
  className?: string;
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;

export function USDCApproval({ spender, amount, onApprovalComplete, className }: USDCApprovalProps) {
  const { address } = useAccount();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const amountBigInt = parseUSDC(amount);

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: [
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
  });

  // Approve USDC spending
  const {
    data: approvalHash,
    writeContract: approve,
    isPending: isApproving,
    error: approvalError,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Check if approval is needed
  useEffect(() => {
    if (allowance !== undefined) {
      const currentAllowance = allowance as bigint;
      setNeedsApproval(currentAllowance < amountBigInt);
      setIsChecking(false);
    }
  }, [allowance, amountBigInt]);

  // Handle approval success
  useEffect(() => {
    if (isApproved) {
      refetchAllowance();
      onApprovalComplete?.();
    }
  }, [isApproved, refetchAllowance, onApprovalComplete]);

  const handleApprove = () => {
    if (!address || !spender) return;

    approve({
      address: USDC_ADDRESS,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'approve',
      args: [spender, amountBigInt],
    });
  };

  // Checking state
  if (isChecking) {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-gray-50 p-4', className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Checking USDC allowance...</span>
        </div>
      </div>
    );
  }

  // No approval needed
  if (!needsApproval) {
    return (
      <div className={cn('rounded-lg border border-green-200 bg-green-50 p-4', className)}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-900">USDC approved</span>
        </div>
      </div>
    );
  }

  // Approval in progress
  if (isApproving || isConfirming) {
    return (
      <div className={cn('rounded-lg border border-blue-200 bg-blue-50 p-4', className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {isApproving ? 'Waiting for wallet confirmation...' : 'Confirming approval...'}
            </span>
          </div>
          {approvalHash && (
            <a
              href={getTransactionUrl(approvalHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              View transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Approval error
  if (approvalError) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-4', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Approval failed</p>
            <p className="mt-1 text-xs text-red-700">{approvalError.message}</p>
            <button
              onClick={handleApprove}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approval needed
  return (
    <div className={cn('rounded-lg border border-yellow-200 bg-yellow-50 p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">Approval required</p>
            <p className="mt-1 text-xs text-yellow-700">
              You need to approve the marketplace to spend {formatUSDC(amountBigInt)} on your behalf.
            </p>
          </div>
        </div>
        <button
          onClick={handleApprove}
          disabled={!address}
          className="w-full rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          Approve USDC
        </button>
      </div>
    </div>
  );
}

/**
 * NFT Approval Component
 *
 * Handles NFT approval for listing/auction creation
 */
interface NFTApprovalProps {
  collectionAddress: Address;
  tokenId: string;
  spender: Address; // Marketplace contract address
  onApprovalComplete?: () => void;
  className?: string;
}

export function NFTApproval({
  collectionAddress,
  tokenId,
  spender,
  onApprovalComplete,
  className,
}: NFTApprovalProps) {
  const { address } = useAccount();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if NFT is approved
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: collectionAddress,
    abi: [
      {
        name: 'getApproved',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
      },
    ],
    functionName: 'getApproved',
    args: [BigInt(tokenId)],
  });

  // Check if operator is approved
  const { data: isApprovedForAll } = useReadContract({
    address: collectionAddress,
    abi: [
      {
        name: 'isApprovedForAll',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'operator', type: 'address' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ],
    functionName: 'isApprovedForAll',
    args: address && spender ? [address, spender] : undefined,
  });

  // Approve NFT
  const {
    data: approvalHash,
    writeContract: approve,
    isPending: isApproving,
    error: approvalError,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Check if approval is needed
  useEffect(() => {
    if (approvedAddress !== undefined || isApprovedForAll !== undefined) {
      const isApprovedSpecific = (approvedAddress as Address)?.toLowerCase() === spender.toLowerCase();
      const isApprovedAll = isApprovedForAll as boolean;
      setNeedsApproval(!isApprovedSpecific && !isApprovedAll);
      setIsChecking(false);
    }
  }, [approvedAddress, isApprovedForAll, spender]);

  // Handle approval success
  useEffect(() => {
    if (isApproved) {
      refetchApproval();
      onApprovalComplete?.();
    }
  }, [isApproved, refetchApproval, onApprovalComplete]);

  const handleApprove = () => {
    if (!address) return;

    approve({
      address: collectionAddress,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'approve',
      args: [spender, BigInt(tokenId)],
    });
  };

  // Checking state
  if (isChecking) {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-gray-50 p-4', className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Checking NFT approval...</span>
        </div>
      </div>
    );
  }

  // No approval needed
  if (!needsApproval) {
    return (
      <div className={cn('rounded-lg border border-green-200 bg-green-50 p-4', className)}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-900">NFT approved</span>
        </div>
      </div>
    );
  }

  // Approval in progress
  if (isApproving || isConfirming) {
    return (
      <div className={cn('rounded-lg border border-blue-200 bg-blue-50 p-4', className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {isApproving ? 'Waiting for wallet confirmation...' : 'Confirming approval...'}
            </span>
          </div>
          {approvalHash && (
            <a
              href={getTransactionUrl(approvalHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              View transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Approval error
  if (approvalError) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-4', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Approval failed</p>
            <p className="mt-1 text-xs text-red-700">{approvalError.message}</p>
            <button
              onClick={handleApprove}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approval needed
  return (
    <div className={cn('rounded-lg border border-yellow-200 bg-yellow-50 p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">Approval required</p>
            <p className="mt-1 text-xs text-yellow-700">
              You need to approve the marketplace to transfer this NFT on your behalf.
            </p>
          </div>
        </div>
        <button
          onClick={handleApprove}
          disabled={!address}
          className="w-full rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          Approve NFT
        </button>
      </div>
    </div>
  );
}
