/**
 * Arc-Specific Utility Functions
 * Helpers for Arc blockchain operations and features
 */

import { arcClient, arcCrypto } from './arc-client';

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
    const tx = await arcClient.getTransaction(txHash);
    const latestBlock = await arcClient.getBlockNumber();

    // Get block timestamp if transaction is confirmed
    let timestamp: number | undefined;
    if (tx.blockNumber) {
      const block = await arcClient.getBlock(tx.blockNumber);
      timestamp = block.timestamp;
    }

    const confirmations = tx.blockNumber ? latestBlock - tx.blockNumber + 1 : 0;
    const isFinalized = confirmations > 0; // Arc has instant finality

    return {
      ...tx,
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
 * Verify Arc signature (useful for profiles/authentication)
 */
export function verifyArcSignature(
  message: string,
  signature: string,
  address: string
): boolean {
  try {
    return arcCrypto.verifySignature(message, signature, address);
  } catch (error) {
    console.error('Failed to verify Arc signature:', error);
    return false;
  }
}

/**
 * Calculate optimal gas for Arc transactions
 * Arc uses USDC for gas, this converts gas to USDC cost
 */
export async function calculateArcGas(txData: any): Promise<ArcGasEstimate> {
  try {
    const [gasLimit, gasPriceHex] = await Promise.all([
      arcClient.estimateGas(txData),
      arcClient.getGasPrice(),
    ]);

    const gasPrice = BigInt(gasPriceHex);

    // Calculate total gas cost in wei
    const totalGasWei = BigInt(gasLimit) * gasPrice;

    // Convert to USDC (assuming 1:1 conversion for gas)
    // TODO: Update with actual Arc gas -> USDC conversion rate
    const gasInUSDC = Number(totalGasWei) / 1e18; // Placeholder conversion

    return {
      gasLimit,
      gasPrice: gasPriceHex,
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
    const [latestBlock, gasPriceHex, chainId] = await Promise.all([
      arcClient.getBlockNumber(),
      arcClient.getGasPrice(),
      arcClient.getChainId(),
    ]);

    // Arc has very fast block times and instant finality
    const blockTime = 0.5; // ~500ms average block time
    const avgFinality = 0.5; // <1 second finality

    return {
      latestBlock,
      gasPrice: gasPriceHex,
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
    const currentBlock = await arcClient.getBlockNumber();
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
  logs: any[];
}> {
  try {
    // Get transaction status
    const txStatus = await getArcTxStatus(txHash);

    if (!txStatus.blockNumber || txStatus.status === 'pending') {
      throw new Error('Transaction not yet mined');
    }

    // Get latest block for confirmations
    const latestBlock = await arcClient.getBlockNumber();
    const confirmations = latestBlock - txStatus.blockNumber + 1;

    // TODO: Get actual receipt data from RPC
    // For now, return basic information
    return {
      status: txStatus.status === 'success' ? 'success' : 'failed',
      gasUsed: 0, // TODO: Get from receipt
      effectiveGasPrice: '0', // TODO: Get from receipt
      blockNumber: txStatus.blockNumber,
      confirmations,
      logs: [], // TODO: Get from receipt
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
    const balancePromises = addresses.map((address) => arcClient.getBalance(address));
    const balances = await Promise.all(balancePromises);

    const balanceMap = new Map<string, string>();
    addresses.forEach((address, index) => {
      balanceMap.set(address, balances[index]);
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
    const blockNumber = await arcClient.getBlockNumber();
    const latency = Date.now() - startTime;

    const isHealthy = latency < 3000; // Consider healthy if response under 3s

    return {
      isHealthy,
      latency,
      blockHeight: blockNumber,
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
