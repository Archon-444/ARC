/**
 * Arc-Specific Utility Functions
 * Helpers for Arc blockchain operations and features
 */

import { publicClient } from './public-client';

/**
 * Arc transaction status with instant finality information
 */
export interface ArcTxStatus {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber?: number;
  blockHash?: string;
  status?: 'pending' | 'success' | 'failed';
  isFinalized: boolean;
  confirmations: number;
  finalityTime: string;
  timestamp?: number;
}

/**
 * Arc gas calculation result
 */
export interface ArcGasEstimate {
  gasLimit: number;
  gasPrice: string;
  gasInUSDC: number;
  gasCostFormatted: string;
  totalCostUSDC: string;
}

/**
 * Arc network statistics
 */
export interface ArcNetworkStats {
  latestBlock: number;
  gasPrice: string;
  chainId: number;
  blockTime: number; // Average block time in seconds
  avgFinality: number; // Average finality time in seconds
}

/**
 * Get Arc transaction status with instant finality info
 * Arc has sub-second finality, so confirmed transactions are immediately final
 */
export async function getArcTxStatus(txHash: string): Promise<ArcTxStatus> {
  try {
    const hash = txHash as `0x${string}`;
    const [tx, latestBlock] = await Promise.all([
      publicClient.getTransaction({ hash }),
      publicClient.getBlockNumber(),
    ]);

    // Receipt may not exist yet for pending transactions
    let receiptStatus: 'pending' | 'success' | 'failed' = 'pending';
    let timestamp: number | undefined;
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      receiptStatus = receipt.status === 'success' ? 'success' : 'failed';
      if (receipt.blockNumber) {
        const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
        timestamp = Number(block.timestamp);
      }
    } catch {
      // Receipt not yet available — transaction pending
    }

    const txBlockNumber = tx.blockNumber ? Number(tx.blockNumber) : undefined;
    const confirmations = txBlockNumber ? Number(latestBlock) - txBlockNumber + 1 : 0;
    const isFinalized = confirmations > 0; // Arc has instant finality

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? '',
      value: tx.value.toString(),
      blockNumber: txBlockNumber,
      blockHash: tx.blockHash ?? undefined,
      status: receiptStatus,
      isFinalized,
      confirmations,
      finalityTime: isFinalized ? '< 1 second' : 'pending',
      timestamp,
    };
  } catch (error) {
    console.error('Failed to get Arc transaction status:', error);
    throw error;
  }
}

/**
 * Wait for transaction to be finalized on Arc
 * @param txHash Transaction hash to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 30s)
 * @returns Transaction status when finalized
 */
export async function waitForArcTxFinality(
  txHash: string,
  timeout: number = 30000
): Promise<ArcTxStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const status = await getArcTxStatus(txHash);

      if (status.isFinalized) {
        return status;
      }

      // Wait 500ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error while waiting for finality:', error);
      // Continue waiting even if there's an error
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Transaction ${txHash} not finalized within ${timeout}ms`);
}

/**
 * Calculate optimal gas for Arc transactions
 * Arc uses USDC for gas, this converts gas to USDC cost
 */
export async function calculateArcGas(
  txData: {
    from?: string;
    to?: string;
    value?: bigint | string;
    data?: string;
  }
): Promise<ArcGasEstimate> {
  try {
    const [gasLimitBigInt, gasPriceBigInt] = await Promise.all([
      publicClient.estimateGas({
        account: txData.from as `0x${string}` | undefined,
        to: txData.to as `0x${string}` | undefined,
        value: typeof txData.value === 'string' ? BigInt(txData.value) : txData.value,
        data: txData.data as `0x${string}` | undefined,
      }),
      publicClient.getGasPrice(),
    ]);

    // Calculate total gas cost in wei
    const totalGasWei = gasLimitBigInt * gasPriceBigInt;

    // Convert to USDC (assuming 1:1 conversion for gas)
    // TODO: Update with actual Arc gas -> USDC conversion rate
    const gasInUSDC = Number(totalGasWei) / 1e18; // Placeholder conversion

    return {
      gasLimit: Number(gasLimitBigInt),
      gasPrice: `0x${gasPriceBigInt.toString(16)}`,
      gasInUSDC,
      gasCostFormatted: `${gasInUSDC.toFixed(6)} USDC`,
      totalCostUSDC: gasInUSDC.toFixed(6),
    };
  } catch (error) {
    console.error('Failed to calculate Arc gas:', error);
    throw error;
  }
}

/**
 * Get Arc network statistics
 */
export async function getArcNetworkStats(): Promise<ArcNetworkStats> {
  try {
    const [latestBlock, gasPriceBigInt, chainId] = await Promise.all([
      publicClient.getBlockNumber(),
      publicClient.getGasPrice(),
      publicClient.getChainId(),
    ]);

    // Arc has very fast block times and instant finality
    const blockTime = 0.5; // ~500ms average block time
    const avgFinality = 0.5; // <1 second finality

    return {
      latestBlock: Number(latestBlock),
      gasPrice: `0x${gasPriceBigInt.toString(16)}`,
      chainId,
      blockTime,
      avgFinality,
    };
  } catch (error) {
    console.error('Failed to get Arc network stats:', error);
    throw error;
  }
}

/**
 * Format Arc address for display (shortened)
 */
export function formatArcAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Validate Arc address format
 */
export function isValidArcAddress(address: string): boolean {
  if (!address) return false;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  return true;
}

/**
 * Convert USDC amount (6 decimals) to readable format
 */
export function formatUSDCAmount(amount: bigint | string | number): string {
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount);
  const dollars = Number(amountBigInt) / 1e6;
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse USDC amount from user input to contract format (6 decimals)
 */
export function parseUSDCAmount(amount: string): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error('Invalid USDC amount');
  }
  return BigInt(Math.floor(num * 1e6));
}

/**
 * Get time until block (useful for auction end times, governance voting periods)
 */
export async function getTimeUntilBlock(targetBlock: number): Promise<{
  blocks: number;
  seconds: number;
  formatted: string;
}> {
  try {
    const currentBlock = Number(await publicClient.getBlockNumber());
    const blocksRemaining = Math.max(0, targetBlock - currentBlock);

    // Arc block time is ~0.5 seconds
    const secondsRemaining = blocksRemaining * 0.5;

    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = Math.floor(secondsRemaining % 60);

    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m `;
    formatted += `${seconds}s`;

    return {
      blocks: blocksRemaining,
      seconds: secondsRemaining,
      formatted: formatted.trim(),
    };
  } catch (error) {
    console.error('Failed to calculate time until block:', error);
    throw error;
  }
}

/**
 * Get transaction receipt with detailed information
 */
export async function getArcTransactionReceipt(txHash: string): Promise<{
  status: 'success' | 'failed';
  gasUsed: number;
  effectiveGasPrice: string;
  blockNumber: number;
  confirmations: number;
  logs: unknown[];
}> {
  try {
    const hash = txHash as `0x${string}`;
    const [receipt, latestBlock] = await Promise.all([
      publicClient.getTransactionReceipt({ hash }),
      publicClient.getBlockNumber(),
    ]);

    const blockNumber = Number(receipt.blockNumber);
    const confirmations = Number(latestBlock) - blockNumber + 1;

    return {
      status: receipt.status === 'success' ? 'success' : 'failed',
      gasUsed: Number(receipt.gasUsed),
      effectiveGasPrice: `0x${receipt.effectiveGasPrice.toString(16)}`,
      blockNumber,
      confirmations,
      logs: receipt.logs,
    };
  } catch (error) {
    console.error('Failed to get transaction receipt:', error);
    throw error;
  }
}

/**
 * Batch get balances for multiple addresses
 */
export async function batchGetBalances(addresses: string[]): Promise<Map<string, string>> {
  try {
    const balances = await Promise.all(
      addresses.map((address) =>
        publicClient.getBalance({ address: address as `0x${string}` })
      )
    );

    const balanceMap = new Map<string, string>();
    addresses.forEach((address, index) => {
      balanceMap.set(address, balances[index].toString());
    });

    return balanceMap;
  } catch (error) {
    console.error('Failed to batch get balances:', error);
    throw error;
  }
}

/**
 * Monitor transaction status with callback
 */
export async function monitorTransaction(
  txHash: string,
  onStatusChange: (status: ArcTxStatus) => void,
  interval: number = 1000,
  timeout: number = 60000
): Promise<ArcTxStatus> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await getArcTxStatus(txHash);
        onStatusChange(status);

        if (status.isFinalized) {
          resolve(status);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Transaction monitoring timeout after ${timeout}ms`));
          return;
        }

        setTimeout(checkStatus, interval);
      } catch (error) {
        reject(error);
      }
    };

    checkStatus();
  });
}

/**
 * Get Arc network health status
 */
export async function getArcNetworkHealth(): Promise<{
  isHealthy: boolean;
  latency: number;
  blockHeight: number;
  message: string;
}> {
  const startTime = Date.now();

  try {
    const blockNumber = await publicClient.getBlockNumber();
    const latency = Date.now() - startTime;

    const isHealthy = latency < 3000; // Consider healthy if response under 3s

    return {
      isHealthy,
      latency,
      blockHeight: Number(blockNumber),
      message: isHealthy
        ? `Arc network is healthy (${latency}ms)`
        : `Arc network may be experiencing issues (${latency}ms)`,
    };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      blockHeight: 0,
      message: `Arc network unreachable: ${error}`,
    };
  }
}
