/**
 * Arc TypeScript SDK Client Wrapper
 * Provides Arc-native blockchain functionality for ArcMarket
 */

// Type definitions for Arc SDK (until official types are available)
interface ArcClientConfig {
  apiUrl?: string;
  apiKey?: string;
  rpcUrl?: string;
}

interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: string[];
}

interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber?: number;
  blockHash?: string;
  status?: 'pending' | 'success' | 'failed';
}

/**
 * Arc Client class for interacting with Arc blockchain
 * TODO: Replace with official @arc-network/arc-ts-sdk once available
 */
class ArcClient {
  private apiUrl: string;
  private rpcUrl: string;
  private apiKey?: string;

  constructor(config: ArcClientConfig = {}) {
    this.apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_ARC_API_URL || 'https://api.arc.circle.com';
    this.rpcUrl = config.rpcUrl || process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    this.apiKey = config.apiKey;
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.error('Failed to get block number:', error);
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber?: number): Promise<BlockInfo> {
    try {
      const blockParam = blockNumber ? `0x${blockNumber.toString(16)}` : 'latest';

      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [blockParam, false],
          id: 1,
        }),
      });

      const data = await response.json();
      const block = data.result;

      return {
        number: parseInt(block.number, 16),
        hash: block.hash,
        timestamp: parseInt(block.timestamp, 16),
        transactions: block.transactions,
      };
    } catch (error) {
      console.error('Failed to get block:', error);
      throw error;
    }
  }

  /**
   * Get transaction information
   */
  async getTransaction(txHash: string): Promise<TransactionInfo> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [txHash],
          id: 1,
        }),
      });

      const data = await response.json();
      const tx = data.result;

      // Get transaction receipt for status
      const receiptResponse = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
      });

      const receiptData = await receiptResponse.json();
      const receipt = receiptData.result;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : undefined,
        blockHash: tx.blockHash,
        status: receipt
          ? receipt.status === '0x1'
            ? 'success'
            : 'failed'
          : 'pending',
      };
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      // ERC20 balanceOf function signature
      const functionSignature = '0x70a08231'; // balanceOf(address)
      const paddedAddress = address.replace('0x', '').padStart(64, '0');
      const data = functionSignature + paddedAddress;

      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: data,
            },
            'latest',
          ],
          id: 1,
        }),
      });

      const responseData = await response.json();
      return responseData.result;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<number> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [transaction],
          id: 1,
        }),
      });

      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<number> {
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      throw error;
    }
  }
}

// Initialize Arc client with default config
export const arcClient = new ArcClient({
  apiUrl: process.env.NEXT_PUBLIC_ARC_API_URL,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  apiKey: process.env.ARC_API_KEY,
});

// Export class for custom instances
export { ArcClient };

// Crypto utilities placeholder (will be replaced with official SDK)
export const arcCrypto = {
  verifySignature: (message: string, signature: string, address: string): boolean => {
    // TODO: Implement proper signature verification
    console.warn('arcCrypto.verifySignature not yet implemented');
    return true;
  },
};

// Helper functions for Arc-specific operations

/**
 * Get Arc block information with finality data
 */
export async function getArcBlockInfo(blockNumber?: number): Promise<BlockInfo> {
  return arcClient.getBlock(blockNumber);
}

/**
 * Get Arc transaction with status
 */
export async function getArcTransaction(txHash: string): Promise<TransactionInfo> {
  return arcClient.getTransaction(txHash);
}

/**
 * Get Arc ETH balance
 */
export async function getArcBalance(address: string): Promise<string> {
  return arcClient.getBalance(address);
}

/**
 * Get USDC balance on Arc (Arc uses USDC for gas and payments)
 */
export async function getUSDCBalance(address: string): Promise<string> {
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error('USDC address not configured');
  }
  return arcClient.getTokenBalance(address, usdcAddress);
}

/**
 * Estimate gas for Arc transaction
 */
export async function estimateArcGas(transaction: any): Promise<number> {
  return arcClient.estimateGas(transaction);
}

/**
 * Get current Arc gas price
 */
export async function getArcGasPrice(): Promise<string> {
  return arcClient.getGasPrice();
}

/**
 * Get Arc chain ID
 */
export async function getArcChainId(): Promise<number> {
  return arcClient.getChainId();
}
