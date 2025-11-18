# Circle Wallets Integration - Phase 2

## Overview

This document describes the Circle User-Controlled Wallets integration for ArcMarket. This feature enables users to create wallets and interact with the marketplace using social login (Google, Facebook, Apple) without requiring MetaMask or managing seed phrases.

## Benefits

### For Users
- ✅ **No MetaMask Required** - Sign in with Google, Facebook, or Apple
- ✅ **No Seed Phrases** - Circle handles key management securely
- ✅ **Familiar UX** - Social login everyone knows
- ✅ **Instant Onboarding** - From signup to marketplace in seconds
- ✅ **Recovery Options** - PIN-based wallet recovery

### For Platform
- ✅ **Higher Conversion** - Reduce friction in user onboarding
- ✅ **Better Retention** - Users don't lose seed phrases
- ✅ **Wider Audience** - Reach non-crypto-native users
- ✅ **Enterprise Security** - Circle's infrastructure
- ✅ **Compliance Ready** - KYC/AML capabilities if needed

## Architecture

```
frontend/
├── src/
│   ├── providers/
│   │   └── CircleWalletProvider.tsx     # Main wallet provider
│   ├── components/
│   │   └── wallet/
│   │       └── SocialLogin.tsx          # Social login UI
│   ├── hooks/
│   │   ├── useArcTransaction.ts         # Transaction monitoring
│   │   ├── useArcNetworkStats.ts        # Network statistics
│   │   ├── useArcBalance.ts             # Balance queries
│   │   └── useArcGasEstimate.ts         # Gas estimation
│   └── app/
│       └── api/
│           └── circle/
│               ├── auth/route.ts         # Authentication
│               ├── wallet/route.ts       # Wallet management
│               └── transaction/route.ts  # Transaction execution
```

## Components

### 1. CircleWalletProvider

Context provider that wraps the app and provides Circle wallet functionality.

**Features:**
- SDK initialization
- Wallet creation and management
- Authentication handling
- Transaction execution
- Persistent connection (localStorage)

**Usage:**

```tsx
// In your app root or layout
import { CircleWalletProvider } from '@/providers/CircleWalletProvider';

export default function RootLayout({ children }) {
  return (
    <CircleWalletProvider appId={process.env.NEXT_PUBLIC_CIRCLE_APP_ID}>
      {children}
    </CircleWalletProvider>
  );
}
```

**Hook:**

```tsx
import { useCircleWallet } from '@/providers/CircleWalletProvider';

function WalletInfo() {
  const {
    wallet,
    isConnected,
    loading,
    createWallet,
    disconnectWallet,
    sendTransaction,
  } = useCircleWallet();

  if (!isConnected) return <div>Not connected</div>;

  return (
    <div>
      <p>Address: {wallet?.address}</p>
      <button onClick={disconnectWallet}>Disconnect</button>
    </div>
  );
}
```

### 2. SocialLogin Component

Provides Google, Facebook, and Apple login with automatic wallet creation.

**Features:**
- Google OAuth integration
- Facebook OAuth integration
- Apple Sign In
- Automatic wallet creation post-auth
- Error handling and loading states
- Fallback to traditional wallet

**Usage:**

```tsx
import { SocialLogin } from '@/components/wallet/SocialLogin';

function LoginModal() {
  return (
    <SocialLogin
      onSuccess={(walletAddress) => {
        console.log('Wallet created:', walletAddress);
        router.push('/profile');
      }}
      onError={(error) => {
        console.error('Login failed:', error);
      }}
    />
  );
}
```

### 3. WalletSelector Component

Combined component showing both social login and traditional wallet options.

**Features:**
- Tabbed interface (Social Login / Wallet)
- Smooth transitions
- Consistent styling
- Fallback support

**Usage:**

```tsx
import { WalletSelector } from '@/components/wallet/SocialLogin';

function ConnectModal() {
  return (
    <WalletSelector
      onSocialLogin={(address) => {
        console.log('Social login successful:', address);
      }}
      onMetaMaskConnect={() => {
        console.log('MetaMask connected');
      }}
    />
  );
}
```

## React Hooks

### Transaction Monitoring

#### useArcTransaction

Monitor transaction status with automatic updates.

```tsx
import { useArcTransaction } from '@/hooks/useArcTransaction';

function PurchaseStatus({ txHash }: { txHash: string }) {
  const { status, loading, error } = useArcTransaction(txHash, {
    pollInterval: 1000,
    onFinalized: (status) => {
      console.log('Transaction finalized!', status);
    },
  });

  if (loading) return <div>Confirming...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Status: {status?.status}</p>
      <p>Finalized: {status?.isFinalized ? 'Yes' : 'No'}</p>
      <p>Finality Time: {status?.finalityTime}</p>
    </div>
  );
}
```

#### useWaitForArcTxFinality

Wait for transaction to be finalized.

```tsx
import { useWaitForArcTxFinality } from '@/hooks/useArcTransaction';

function BuyNFT() {
  const { waitForFinality, loading } = useWaitForArcTxFinality();

  const handleBuy = async () => {
    const tx = await buyItem(collectionAddress, tokenId);
    const finalStatus = await waitForFinality(tx.hash);

    if (finalStatus.status === 'success') {
      alert('NFT purchased!');
    }
  };

  return (
    <button onClick={handleBuy} disabled={loading}>
      {loading ? 'Processing...' : 'Buy NFT'}
    </button>
  );
}
```

### Balance Queries

#### useArcUSDCBalance

Get USDC balance with auto-refresh.

```tsx
import { useArcUSDCBalance } from '@/hooks/useArcBalance';

function BalanceDisplay({ address }: { address: string }) {
  const { balance, formatted, loading } = useArcUSDCBalance(address, {
    refreshInterval: 10000, // Refresh every 10s
  });

  return (
    <div>
      <p>Balance: {formatted} USDC</p>
      <p className="text-xs">Raw: {balance?.toString()}</p>
    </div>
  );
}
```

#### useArcSufficientBalance

Check if user has sufficient balance for a transaction.

```tsx
import { useArcSufficientBalance } from '@/hooks/useArcBalance';
import { useAccount } from 'wagmi';

function BuyButton({ price }: { price: bigint }) {
  const { address } = useAccount();
  const { hasSufficientBalance, shortfallFormatted } = useArcSufficientBalance(
    address,
    price
  );

  return (
    <button disabled={!hasSufficientBalance}>
      {hasSufficientBalance
        ? 'Buy NFT'
        : `Need ${shortfallFormatted} more USDC`}
    </button>
  );
}
```

### Gas Estimation

#### useArcGasEstimate

Estimate gas for transactions (in USDC).

```tsx
import { useArcGasEstimate } from '@/hooks/useArcGasEstimate';

function TransactionPreview({ txData }) {
  const { gasEstimate, loading } = useArcGasEstimate(txData, {
    autoUpdate: true,
  });

  return (
    <div>
      {loading ? (
        <p>Estimating gas...</p>
      ) : (
        <p>Estimated Gas: {gasEstimate?.gasCostFormatted}</p>
      )}
    </div>
  );
}
```

#### useArcTotalCost

Calculate total cost including gas.

```tsx
import { useArcTotalCost } from '@/hooks/useArcGasEstimate';

function PurchaseSummary({ price, txData }) {
  const { breakdown, loading } = useArcTotalCost(price, txData);

  if (loading) return <div>Calculating...</div>;

  return (
    <div>
      <p>NFT Price: {breakdown.priceFormatted}</p>
      <p>Gas Fee: {breakdown.gasFormatted}</p>
      <p className="font-bold">Total: {breakdown.totalFormatted} USDC</p>
    </div>
  );
}
```

### Network Statistics

#### useArcNetworkStats

Get network statistics with auto-refresh.

```tsx
import { useArcNetworkStats } from '@/hooks/useArcNetworkStats';

function NetworkInfo() {
  const { stats, health, loading } = useArcNetworkStats({
    refreshInterval: 30000,
    includeHealth: true,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Block: #{stats?.latestBlock}</p>
      <p>Block Time: {stats?.blockTime}s</p>
      <p>Status: {health?.isHealthy ? '🟢 Healthy' : '🔴 Issues'}</p>
    </div>
  );
}
```

## API Routes

### Authentication API

**POST /api/circle/auth**
Generate authentication tokens for Circle SDK.

```bash
curl -X POST http://localhost:3000/api/circle/auth \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "email": "user@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "userToken": "token_...",
  "encryptionKey": "key_...",
  "expiresIn": 3600
}
```

### Wallet Management API

**POST /api/circle/wallet**
Create a new wallet.

```bash
curl -X POST http://localhost:3000/api/circle/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "email": "user@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "wallet": {
    "id": "wallet_abc123",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "userId": "user123",
    "createDate": "2025-11-18T10:00:00Z"
  }
}
```

**GET /api/circle/wallet?address=0x...**
Retrieve wallet information.

```bash
curl "http://localhost:3000/api/circle/wallet?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
```

### Transaction API

**POST /api/circle/transaction**
Execute a transaction.

```bash
curl -X POST http://localhost:3000/api/circle/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "wallet_abc123",
    "to": "0x...",
    "value": "1000000",
    "data": "0x..."
  }'
```

Response:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "status": "PENDING",
  "estimatedConfirmationTime": "< 1 second"
}
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Circle Platform
NEXT_PUBLIC_CIRCLE_APP_ID=your_circle_app_id
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
CIRCLE_WALLET_SET_ID=your_wallet_set_id

# Arc SDK (from Phase 1)
NEXT_PUBLIC_ARC_API_URL=https://api.arc.circle.com
NEXT_PUBLIC_RPC_URL=https://rpc.arc.circle.com
ARC_API_KEY=your_arc_api_key
```

## Production Setup

### 1. Register with Circle

1. Go to https://console.circle.com/
2. Create a new account
3. Create a new app
4. Get your API keys and App ID

### 2. Configure OAuth Providers

#### Google

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Implement with NextAuth or @react-oauth/google

#### Facebook

1. Go to Facebook Developers
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs

#### Apple

1. Go to Apple Developer
2. Create a Services ID
3. Configure Sign in with Apple
4. Add return URLs

### 3. Implement Authentication

Use NextAuth.js for production OAuth:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Create Circle wallet for new users
      if (account?.provider && user.email) {
        await createCircleWallet(user.id, user.email);
      }
      return true;
    },
  },
});

export { handler as GET, handler as POST };
```

### 4. Replace Mock Implementation

Update SocialLogin.tsx to use real OAuth:

```typescript
// Replace mockGoogleAuth() with:
import { signIn } from 'next-auth/react';

const handleGoogleLogin = async () => {
  const result = await signIn('google', { redirect: false });
  if (result?.ok) {
    // Wallet is created automatically by NextAuth callback
    const session = await getSession();
    onSuccess?.(session.wallet.address);
  }
};
```

## Testing

### Test Social Login Flow

```bash
# 1. Start development server
npm run dev

# 2. Navigate to login page
open http://localhost:3000

# 3. Click "Continue with Google" (or Facebook/Apple)
# 4. Sign in with test account
# 5. Verify wallet is created
# 6. Check localStorage for persistence
```

### Test Wallet Functionality

```tsx
// Test component
function TestWallet() {
  const { wallet, createWallet, sendTransaction } = useCircleWallet();

  const testWalletCreation = async () => {
    const address = await createWallet('test_user', 'test@example.com');
    console.log('Wallet created:', address);
  };

  const testTransaction = async () => {
    const txHash = await sendTransaction({
      to: '0x...',
      value: '1000000',
    });
    console.log('Transaction sent:', txHash);
  };

  return (
    <div>
      <button onClick={testWalletCreation}>Create Test Wallet</button>
      <button onClick={testTransaction}>Send Test TX</button>
      {wallet && <p>Wallet: {wallet.address}</p>}
    </div>
  );
}
```

## Security Considerations

1. **Token Storage**: Never store sensitive tokens in localStorage
2. **API Keys**: Keep API keys server-side only
3. **Authentication**: Verify user ownership before operations
4. **Rate Limiting**: Implement rate limiting on API routes
5. **Input Validation**: Validate all transaction parameters
6. **HTTPS**: Always use HTTPS in production
7. **CSP Headers**: Configure Content Security Policy

## Troubleshooting

### Wallet Creation Fails

```typescript
// Check if SDK is initialized
const { isInitialized } = useCircleWallet();
if (!isInitialized) {
  console.error('Circle SDK not initialized');
}

// Check authentication tokens
if (!userToken || !encryptionKey) {
  console.error('Authentication tokens missing');
}
```

### Transaction Fails

```typescript
// Verify wallet is connected
if (!wallet) {
  throw new Error('No wallet connected');
}

// Check balance
const { hasSufficientBalance } = useArcSufficientBalance(wallet.address, amount);
if (!hasSufficientBalance) {
  throw new Error('Insufficient balance');
}
```

### OAuth Redirect Issues

1. Verify redirect URIs are configured
2. Check OAuth provider settings
3. Ensure callback URLs match exactly
4. Check for CORS issues

## Next Steps (Phase 3)

- Circle Bridge Kit for cross-chain transfers
- Ethereum → Arc USDC bridging
- Polygon → Arc USDC bridging
- Arbitrum → Arc USDC bridging

## Support

- Circle Docs: https://developers.circle.com/
- Circle Support: https://support.circle.com/
- Arc Documentation: (to be added)
- ArcMarket Discord: (to be added)

## License

MIT License - see LICENSE file for details
