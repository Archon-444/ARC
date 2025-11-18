# Arc SDK Integration Documentation

## Overview

This document describes the Arc TypeScript SDK integration for ArcMarket NFT Marketplace. The integration provides Arc-native blockchain functionality including transaction monitoring, gas estimation, and network utilities.

## Architecture

```
frontend/src/lib/
├── arc-client.ts       # Core Arc blockchain client
├── arc-utils.ts        # Arc-specific utility functions
└── test-arc-sdk.ts     # Integration tests
```

## Core Features

### 1. **Arc Client** (`arc-client.ts`)

The Arc client provides low-level access to Arc blockchain via JSON-RPC:

```typescript
import { arcClient } from '@/lib/arc-client';

// Get latest block number
const blockNumber = await arcClient.getBlockNumber();

// Get block information
const block = await arcClient.getBlock(blockNumber);

// Get transaction
const tx = await arcClient.getTransaction('0x...');

// Get balance
const balance = await arcClient.getBalance('0x...');

// Get token balance (USDC)
const usdcBalance = await arcClient.getTokenBalance('0xUserAddress', '0xUSDCAddress');

// Estimate gas
const gasEstimate = await arcClient.estimateGas({
  from: '0x...',
  to: '0x...',
  value: '0x0',
  data: '0x...'
});
```

### 2. **Arc Utilities** (`arc-utils.ts`)

Higher-level utilities for common Arc operations:

#### Transaction Monitoring

```typescript
import { getArcTxStatus, waitForArcTxFinality, monitorTransaction } from '@/lib/arc-utils';

// Get transaction status with finality info
const status = await getArcTxStatus('0x...');
console.log('Finalized:', status.isFinalized);
console.log('Finality time:', status.finalityTime); // "< 1 second"

// Wait for transaction to be finalized
const finalStatus = await waitForArcTxFinality('0x...', 30000);

// Monitor transaction with callback
await monitorTransaction('0x...', (status) => {
  console.log('Status update:', status);
}, 1000, 60000);
```

#### Gas Calculations

```typescript
import { calculateArcGas } from '@/lib/arc-utils';

const gasEstimate = await calculateArcGas({
  from: '0x...',
  to: '0x...',
  value: '0x0',
  data: '0x...'
});

console.log('Gas limit:', gasEstimate.gasLimit);
console.log('Gas cost:', gasEstimate.gasCostFormatted); // "0.001234 USDC"
```

#### Network Statistics

```typescript
import { getArcNetworkStats, getArcNetworkHealth } from '@/lib/arc-utils';

// Get network stats
const stats = await getArcNetworkStats();
console.log('Chain ID:', stats.chainId);
console.log('Block time:', stats.blockTime); // 0.5 seconds
console.log('Avg finality:', stats.avgFinality); // 0.5 seconds

// Check network health
const health = await getArcNetworkHealth();
console.log('Healthy:', health.isHealthy);
console.log('Latency:', health.latency, 'ms');
```

#### Address Utilities

```typescript
import { formatArcAddress, isValidArcAddress } from '@/lib/arc-utils';

// Format address for display
const shortAddr = formatArcAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');
// "0x742d...0bEb1"

// Validate address
const isValid = isValidArcAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');
// true
```

#### USDC Utilities

```typescript
import { formatUSDCAmount, parseUSDCAmount } from '@/lib/arc-utils';

// Format USDC for display (6 decimals)
const formatted = formatUSDCAmount(1000000n); // "1.00"
const formatted2 = formatUSDCAmount(1234567n); // "1.234567"

// Parse user input to contract format
const amount = parseUSDCAmount('100.50'); // 100500000n
```

## Integration with Existing Hooks

### Enhanced USDC Balance Hook

```typescript
import { useEffect, useState } from 'react';
import { getUSDCBalance } from '@/lib/arc-client';

export function useArcUSDCBalance(address?: string) {
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const arcBalance = await getUSDCBalance(address);
        setBalance(BigInt(arcBalance));
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch USDC balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Poll every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return { balance, loading, error };
}
```

### Transaction Monitoring Hook

```typescript
import { useState, useEffect } from 'react';
import { monitorTransaction, ArcTxStatus } from '@/lib/arc-utils';

export function useArcTransaction(txHash?: string) {
  const [status, setStatus] = useState<ArcTxStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!txHash) return;

    setLoading(true);
    monitorTransaction(
      txHash,
      (newStatus) => {
        setStatus(newStatus);
        if (newStatus.isFinalized) {
          setLoading(false);
        }
      },
      1000,
      60000
    ).catch((err) => {
      setError(err);
      setLoading(false);
    });
  }, [txHash]);

  return { status, loading, error };
}
```

### Network Stats Hook

```typescript
import { useState, useEffect } from 'react';
import { getArcNetworkStats, ArcNetworkStats } from '@/lib/arc-utils';

export function useArcNetworkStats() {
  const [stats, setStats] = useState<ArcNetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const networkStats = await getArcNetworkStats();
        setStats(networkStats);
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Update every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Arc SDK Configuration
NEXT_PUBLIC_ARC_API_URL=https://api.arc.circle.com
NEXT_PUBLIC_RPC_URL=https://rpc.arc.circle.com
ARC_API_KEY=your_arc_api_key_here

# Contract Addresses
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
```

## Testing

Run the Arc SDK integration tests:

```bash
# Test Arc SDK connection
npx ts-node src/lib/test-arc-sdk.ts

# Or add to package.json scripts:
{
  "scripts": {
    "test:arc": "ts-node src/lib/test-arc-sdk.ts"
  }
}

# Then run:
npm run test:arc
```

## Usage Examples

### 1. Display Transaction Status with Finality

```typescript
import { useArcTransaction } from '@/hooks/useArcTransaction';

function TransactionStatus({ txHash }: { txHash: string }) {
  const { status, loading } = useArcTransaction(txHash);

  if (loading) return <div>Monitoring transaction...</div>;
  if (!status) return null;

  return (
    <div>
      <p>Status: {status.status}</p>
      <p>Finalized: {status.isFinalized ? 'Yes' : 'No'}</p>
      <p>Finality Time: {status.finalityTime}</p>
      <p>Confirmations: {status.confirmations}</p>
    </div>
  );
}
```

### 2. Display Network Stats

```typescript
import { useArcNetworkStats } from '@/hooks/useArcNetworkStats';

function NetworkStats() {
  const { stats, loading } = useArcNetworkStats();

  if (loading || !stats) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Latest Block</p>
        <p className="text-2xl font-bold">{stats.latestBlock}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Block Time</p>
        <p className="text-2xl font-bold">{stats.blockTime}s</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Finality</p>
        <p className="text-2xl font-bold">{stats.avgFinality}s</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Chain ID</p>
        <p className="text-2xl font-bold">{stats.chainId}</p>
      </div>
    </div>
  );
}
```

### 3. Enhanced Buy Button with Gas Estimation

```typescript
import { useState } from 'react';
import { calculateArcGas, formatUSDCAmount } from '@/lib/arc-utils';

function BuyButton({ nftPrice, onBuy }: { nftPrice: bigint; onBuy: () => void }) {
  const [gasEstimate, setGasEstimate] = useState<string>('');

  const estimateGas = async () => {
    const estimate = await calculateArcGas({
      // ... transaction data
    });
    setGasEstimate(estimate.gasCostFormatted);
  };

  return (
    <div>
      <p>Price: {formatUSDCAmount(nftPrice)} USDC</p>
      {gasEstimate && <p>Est. Gas: {gasEstimate}</p>}
      <button onClick={onBuy} onMouseEnter={estimateGas}>
        Buy NFT
      </button>
    </div>
  );
}
```

## Arc-Specific Features

### Sub-Second Finality

Arc blockchain provides sub-second finality. Once a transaction is included in a block, it's immediately final:

```typescript
const status = await getArcTxStatus(txHash);
if (status.isFinalized) {
  console.log('Transaction is final! No need to wait for confirmations.');
  console.log('Finality time:', status.finalityTime); // "< 1 second"
}
```

### USDC-Based Gas

Arc uses USDC for gas payments. The SDK provides utilities to calculate gas costs in USDC:

```typescript
const gasEstimate = await calculateArcGas(txData);
console.log('Gas cost:', gasEstimate.gasCostFormatted); // "0.001234 USDC"
console.log('Total cost:', gasEstimate.totalCostUSDC);
```

### Fast Block Times

Arc has ~500ms block times, providing near-instant transaction confirmation:

```typescript
const stats = await getArcNetworkStats();
console.log('Block time:', stats.blockTime); // 0.5 seconds
console.log('Avg finality:', stats.avgFinality); // 0.5 seconds
```

## Future Enhancements

### Phase 2: Circle User-Controlled Wallets

- Social login (Google, Facebook, Apple)
- No seed phrases required
- Programmable wallets

### Phase 3: Circle Bridge Kit

- Cross-chain USDC transfers
- Bring funds from Ethereum, Polygon, Arbitrum
- CCTP integration

### Phase 4: Circle Contracts SDK

- Deploy contracts via API
- Programmable contract management
- Batch operations

## Troubleshooting

### Network Connection Issues

If you encounter network errors:

```typescript
import { getArcNetworkHealth } from '@/lib/arc-utils';

const health = await getArcNetworkHealth();
if (!health.isHealthy) {
  console.error('Arc network issue:', health.message);
  console.error('Latency:', health.latency, 'ms');
}
```

### Transaction Not Found

If a transaction is not found:

```typescript
try {
  const status = await getArcTxStatus(txHash);
} catch (error) {
  console.error('Transaction not found. It may not be propagated yet.');
  // Retry after 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Balance Query Fails

If balance queries fail:

```typescript
try {
  const balance = await getUSDCBalance(address);
} catch (error) {
  console.error('Balance query failed:', error);
  // Fallback to wagmi/ethers
  const fallbackBalance = await wagmiGetBalance(address);
}
```

## Best Practices

1. **Use hooks for React components** - Wrap Arc SDK calls in custom hooks
2. **Handle errors gracefully** - Always catch and handle errors
3. **Cache network stats** - Don't query network stats on every render
4. **Monitor transactions** - Use `monitorTransaction` for real-time updates
5. **Validate addresses** - Always validate addresses before queries
6. **Format USDC correctly** - Use `formatUSDCAmount` for display, `parseUSDCAmount` for input

## Support

For issues or questions:
- Arc SDK Issues: https://github.com/threesigmaxyz/arc-ts-sdk/issues
- Circle Platform: https://developers.circle.com/support
- ArcMarket: Contact the development team

## License

MIT License - see LICENSE file for details
