# Circle SDK Integration Guide

**Status:** ✅ **FULLY INTEGRATED** (Wallets + Smart Contracts + Cross-Chain Bridging)

**What's Working:**
- ✅ **User-Controlled Wallets** (`@circle-fin/user-controlled-wallets@9.3.0`)
- ✅ **Web SDK** (`@circle-fin/w3s-pw-web-sdk@1.1.11`)
- ✅ **Smart Contract Platform** (`@circle-fin/smart-contract-platform@1.8.11`)
- ✅ **Bridge Kit** (`@circle-fin/bridge-kit@3.5.0`) - Cross-chain USDC transfers
- ✅ Automatic PIN/challenge handling
- ✅ NextAuth social login integration
- ✅ Complete wallet creation flow
- ✅ Programmatic contract deployment
- ✅ Cross-chain USDC bridging (34 chains, 544 routes)

This guide explains how to set up and use Circle's complete SDK suite in ArcMarket.

## Overview

ArcMarket integrates Circle's User-Controlled Wallets SDK to provide:
- **No MetaMask Required**: Users can create wallets using social login (Google, Facebook, Apple)
- **User-Controlled**: Users own their private keys via PIN/biometric authentication
- **Seamless Onboarding**: Familiar web2 login experience with web3 security

## Architecture

```
┌──────────────────────────┐
│  Frontend (Browser)      │
│  - CircleWalletProvider  │
│  - useCircleWallet()     │
│  - Web SDK (PIN/Challenge) │ ◄── Handles PIN, biometric, challenges
└──────────┬───────────────┘
           │ HTTP
           ▼
┌──────────────────────────┐
│ Backend (Next.js API)    │
│  /api/circle/auth        │
│  /api/circle/wallet      │
│  - Node.js SDK           │ ◄── Creates users, wallets, tokens
└──────────┬───────────────┘
           │ HTTPS
           ▼
┌──────────────────────────┐
│  Circle API              │
│  - User Management       │
│  - Wallet Creation       │
│  - Token Generation      │
│  - Challenge Processing  │
└──────────────────────────┘
```

**Key Points:**
- ✅ **Backend SDK** (`@circle-fin/user-controlled-wallets`) - Server-side user/wallet management
- ✅ **Web SDK** (`@circle-fin/w3s-pw-web-sdk`) - Browser-side PIN/challenge handling
- ✅ Frontend calls backend APIs → Backend calls Circle API
- ✅ Web SDK handles challenge execution (PIN setup) in the browser
- ✅ User authentication via NextAuth (social login)

## Prerequisites

1. **Circle Developer Account**
   - Sign up at https://console.circle.com/
   - Create a new project

2. **Circle API Key**
   - Navigate to **API Keys** in Circle Console
   - Create a new API key
   - **IMPORTANT**: This is a server-side secret - never expose it to the client

3. **OAuth Providers** (for social login)
   - Google: https://console.cloud.google.com/
   - Facebook: https://developers.facebook.com/
   - Apple: https://developer.apple.com/

## Environment Setup

### Step 1: Copy Environment Template

```bash
cd frontend
cp .env.example .env.local
```

### Step 2: Configure Circle Credentials

Circle provides separate API credentials for **testnet** and **mainnet** environments. Configure both sets of credentials in `.env.local`:

```env
# ===========================
# Circle Configuration
# ===========================
# Choose environment: 'testnet' or 'mainnet'
NEXT_PUBLIC_CIRCLE_ENVIRONMENT=testnet

# Circle Testnet Credentials
# Get these from https://console.circle.com/api-keys (Testnet Environment)
CIRCLE_API_KEY_TESTNET=your_testnet_api_key_here
NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET=your_testnet_app_id_here
CIRCLE_ENTITY_SECRET_TESTNET=your_testnet_entity_secret_here  # Optional, for Smart Contract Platform

# Circle Mainnet Credentials
# Get these from https://console.circle.com/api-keys (Mainnet Environment)
CIRCLE_API_KEY_MAINNET=your_mainnet_api_key_here
NEXT_PUBLIC_CIRCLE_APP_ID_MAINNET=your_mainnet_app_id_here
CIRCLE_ENTITY_SECRET_MAINNET=your_mainnet_entity_secret_here  # Optional, for Smart Contract Platform
```

⚠️ **Security Note**:
- `CIRCLE_API_KEY_*` and `CIRCLE_ENTITY_SECRET_*` = Server-side secrets (NO `NEXT_PUBLIC_` prefix)
- `NEXT_PUBLIC_CIRCLE_APP_ID_*` and `NEXT_PUBLIC_CIRCLE_ENVIRONMENT` = Public, safe to expose

🔄 **Environment Switching**:
- Set `NEXT_PUBLIC_CIRCLE_ENVIRONMENT=testnet` for development/testing
- Set `NEXT_PUBLIC_CIRCLE_ENVIRONMENT=mainnet` for production
- All SDKs automatically use the correct credentials based on this setting
- No code changes needed - just change the environment variable!

### Step 3: Configure OAuth Providers

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Change to your production URL
NEXTAUTH_SECRET=your_random_32_char_secret  # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (optional)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Apple OAuth (optional)
APPLE_CLIENT_ID=your_apple_service_id
APPLE_CLIENT_SECRET=your_apple_private_key
```

## Circle Console Setup

### 1. Create a Project

1. Log in to https://console.circle.com/
2. Click **Create Project**
3. Choose **User-Controlled Wallets**
4. Name your project (e.g., "ArcMarket")

### 2. Generate API Keys (Testnet and Mainnet)

Circle provides separate credentials for testnet and mainnet environments:

**Testnet Credentials:**
1. In Circle Console, switch to **Testnet** environment (top-right selector)
2. Go to **API Keys** section
3. Click **Create API Key**
4. Copy the API key and App ID immediately (won't be shown again)
5. Add to your `.env.local` as `CIRCLE_API_KEY_TESTNET` and `NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET`

**Mainnet Credentials:**
1. In Circle Console, switch to **Mainnet** environment (top-right selector)
2. Go to **API Keys** section
3. Click **Create API Key**
4. Copy the API key and App ID
5. Add to your `.env.local` as `CIRCLE_API_KEY_MAINNET` and `NEXT_PUBLIC_CIRCLE_APP_ID_MAINNET`

**Smart Contract Platform (Optional):**
- If using programmatic contract deployment, also generate Entity Secrets for both environments
- Follow: https://developers.circle.com/interactive-quickstarts/dev-controlled-wallets
- Add to `.env.local` as `CIRCLE_ENTITY_SECRET_TESTNET` and `CIRCLE_ENTITY_SECRET_MAINNET`

### 3. Configure Webhooks (Optional)

For production, set up webhooks to receive wallet creation events:

1. Go to **Webhooks** section
2. Add endpoint: `https://yourdomain.com/api/circle/webhook`
3. Subscribe to events:
   - `wallet.created`
   - `transaction.created`
   - `transaction.confirmed`

## Environment-Based Configuration

ArcMarket uses an intelligent environment-based configuration system that automatically selects the correct Circle credentials based on the `NEXT_PUBLIC_CIRCLE_ENVIRONMENT` variable.

### How It Works

The system uses helper functions in `src/lib/circle-config.ts`:

- `getCircleEnvironment()` - Returns current environment ('testnet' or 'mainnet')
- `getCircleApiKey()` - Returns API key for current environment
- `getCircleAppId()` - Returns App ID for current environment
- `getCircleEntitySecret()` - Returns Entity Secret for current environment

All Circle SDKs automatically use these functions, so you don't need to manually manage which credentials to use.

### Switching Environments

**Development/Testing:**
```env
NEXT_PUBLIC_CIRCLE_ENVIRONMENT=testnet
```
- Uses `CIRCLE_API_KEY_TESTNET`, `NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET`, etc.
- Safe for testing without affecting real funds
- Free Circle testnet credits available

**Production:**
```env
NEXT_PUBLIC_CIRCLE_ENVIRONMENT=mainnet
```
- Uses `CIRCLE_API_KEY_MAINNET`, `NEXT_PUBLIC_CIRCLE_APP_ID_MAINNET`, etc.
- Real transactions with actual USDC
- Production-ready Circle infrastructure

### Validation

The configuration includes built-in validation:

```typescript
import { validateCircleConfig, getCircleConfigSummary } from '@/lib/circle-config';

// Check if configuration is complete
const { isValid, errors } = validateCircleConfig();
if (!isValid) {
  console.error('Circle configuration errors:', errors);
}

// Get configuration summary for debugging
const summary = getCircleConfigSummary();
console.log('Circle Config:', summary);
// Output: { environment: 'testnet', hasApiKey: true, hasAppId: true, hasEntitySecret: true }
```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env.local`

### Facebook OAuth Setup

1. Go to https://developers.facebook.com/
2. Create a new app or select existing
3. Add **Facebook Login** product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://yourdomain.com/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

### Apple OAuth Setup (Advanced)

1. Go to https://developer.apple.com/account/
2. Create **Service ID**
3. Enable **Sign in with Apple**
4. Configure return URLs
5. Generate private key
6. Add to `.env.local`

## Implementation Details

### Backend API Routes

#### 1. Authentication (`/api/circle/auth`)

**POST /api/circle/auth**
- Creates Circle user (if not exists)
- Generates user token and encryption key
- Requires NextAuth session

```typescript
// Request
POST /api/circle/auth
Content-Type: application/json

{
  "userId": "user@example.com",
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "userToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "encryptionKey": "7f3a5c2e...",
  "expiresIn": 3600
}
```

#### 2. Wallet Management (`/api/circle/wallet`)

**POST /api/circle/wallet** - Create Wallet
```typescript
// Request
{
  "userId": "user@example.com",
  "userToken": "eyJhbG...",
  "blockchains": ["ETH"],  // or ["MATIC", "AVAX", etc.]
  "accountType": "EOA"     // or "SCA" for smart contract accounts
}

// Response
{
  "success": true,
  "challengeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Wallet creation challenge created. User must complete PIN setup."
}
```

**GET /api/circle/wallet** - List Wallets
```
GET /api/circle/wallet?userToken=eyJhbG...

Response:
{
  "success": true,
  "wallets": [
    {
      "id": "wallet-id-123",
      "address": "0x1234...5678",
      "blockchain": "ETH",
      "state": "LIVE",
      "createDate": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Frontend Usage

#### 1. Wrap App with Provider

```tsx
// app/layout.tsx
import { CircleWalletProvider } from '@/providers/CircleWalletProvider';

export default function RootLayout({ children }) {
  return (
    <SessionProvider>  {/* NextAuth */}
      <CircleWalletProvider>
        {children}
      </CircleWalletProvider>
    </SessionProvider>
  );
}
```

#### 2. Use Circle Wallet Hook

```tsx
import { useCircleWallet } from '@/providers/CircleWalletProvider';

function WalletButton() {
  const {
    wallets,
    activeWallet,
    isConnected,
    loading,
    createWallet,
    loadWallets
  } = useCircleWallet();

  const handleCreateWallet = async () => {
    try {
      const challengeId = await createWallet(['ETH']);
      console.log('Wallet creation initiated:', challengeId);
      // TODO: Handle PIN setup challenge with Circle Web SDK
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!isConnected) {
    return <button onClick={handleCreateWallet}>Create Wallet</button>;
  }

  return (
    <div>
      <p>Address: {activeWallet?.address}</p>
      <p>Blockchain: {activeWallet?.blockchain}</p>
    </div>
  );
}
```

## Wallet Creation Flow

### Current Implementation (Server-Side)

1. User signs in with social login (NextAuth)
2. Frontend calls `/api/circle/auth` → Creates Circle user + gets token
3. Frontend calls `/api/circle/wallet` → Initiates wallet creation
4. **Backend returns `challengeId`**

### ⚠️ Next Steps Required: Web SDK Integration

Circle's wallet creation requires the user to set up a PIN via their Web SDK. You need to:

1. **Install Circle Web SDK** (browser-side):
   ```bash
   npm install @circle-fin/w3s-pw-web-sdk
   ```

2. **Complete Challenge in Browser**:
   ```tsx
   import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';

   const sdk = new W3SSdk();
   await sdk.execute(challengeId, (error, result) => {
     if (error) {
       console.error('PIN setup failed:', error);
     } else {
       console.log('Wallet created:', result);
     }
   });
   ```

3. **Poll for Wallet Status**:
   After challenge completion, the wallet becomes available via `GET /api/circle/wallet`.

## Testing

### Development Testing

1. **Start Next.js Dev Server**:
   ```bash
   npm run dev
   ```

2. **Test OAuth Login**:
   - Navigate to `http://localhost:3000`
   - Click "Sign in with Google" (or other provider)
   - Verify NextAuth session is created

3. **Test Wallet Creation**:
   - After login, trigger wallet creation
   - Check backend logs for Circle API calls
   - Verify `challengeId` is returned

4. **Check Circle Console**:
   - Go to https://console.circle.com/
   - Navigate to **Users** section
   - Verify user was created
   - Check **Wallets** for wallet creation attempts

### Testnet Testing

Circle supports multiple testnets:
- Ethereum Sepolia
- Polygon Mumbai
- Avalanche Fuji

Wallets created on testnets can receive testnet tokens for testing.

## Production Checklist

Before deploying to production:

- [ ] Generate strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Configure OAuth redirect URIs for production domain
- [ ] Set up Circle webhooks for production endpoint
- [ ] Enable rate limiting on API routes
- [ ] Set up monitoring for Circle API errors
- [ ] Test wallet creation end-to-end with Web SDK
- [ ] Verify session security and token expiration
- [ ] Add proper error handling and user feedback
- [ ] Configure CORS if needed for API routes

## Cross-Chain Bridging (Bridge Kit)

ArcMarket integrates Circle's **Bridge Kit** for seamless USDC transfers between blockchains. This enables users to bridge USDC from other chains to Arc blockchain.

### Features

- **34 Supported Chains**: Ethereum, Base, Arbitrum, Polygon, Avalanche, Optimism, Solana, and more
- **544 Bridge Routes**: Comprehensive cross-chain coverage
- **Circle CCTP**: Uses Circle's Cross-Chain Transfer Protocol for secure, native USDC transfers
- **Type-Safe API**: Full TypeScript support with runtime validation
- **Speed Options**: FAST (higher fees, ~15 min) or SLOW (lower fees, ~30 min)
- **Cost Estimation**: Get fees upfront before bridging
- **Browser Wallet Support**: Works with MetaMask, Rainbow, etc.

### Usage

**Basic Bridge Operation:**

```typescript
import { useCircleBridge } from '@/hooks/useCircleBridge';

function BridgeComponent() {
  const { bridge, estimateBridge, isLoading } = useCircleBridge();

  const handleBridge = async () => {
    // 1. Get cost estimate first
    const estimate = await estimateBridge({
      fromChain: 'Ethereum',
      toChain: 'Base',
      amount: '100.00',
    });
    console.log('Bridge fees:', estimate.fees);
    console.log('Total cost:', estimate.totalCost);

    // 2. Execute bridge
    const result = await bridge({
      fromChain: 'Ethereum',
      toChain: 'Base',
      amount: '100.00',
      speed: 'FAST', // or 'SLOW'
    });

    if (result.state === 'success') {
      console.log('USDC bridged successfully!');
    }
  };

  return (
    <button onClick={handleBridge} disabled={isLoading}>
      {isLoading ? 'Bridging...' : 'Bridge USDC'}
    </button>
  );
}
```

**Bridge to Different Address:**

```typescript
const result = await bridge({
  fromChain: 'Ethereum',
  toChain: 'Base',
  amount: '100.00',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Send to someone else
  speed: 'FAST',
});
```

**Check Route Support:**

```typescript
const { checkRouteSupport } = useCircleBridge();

const isSupported = await checkRouteSupport('Ethereum', 'Arc');
if (isSupported) {
  console.log('Ethereum → Arc bridging is supported!');
}
```

**Retry Failed Bridge:**

```typescript
const { retryBridge } = useCircleBridge();

// If bridge fails, retry it
if (result.state === 'error') {
  const retryResult = await retryBridge(result);
}
```

### Supported Chains

**Mainnet (17 chains):**
- Ethereum, Base, Arbitrum, Polygon PoS, Optimism
- Avalanche, Solana, Linea, Sei, Sonic
- Unichain, World Chain, XDC, Plume, Ink
- HyperEVM, Codex

**Testnet (17 chains):**
- Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia
- Polygon Amoy, OP Sepolia, Avalanche Fuji
- Solana Devnet, and more...

### Use Cases for ArcMarket

1. **User Onboarding**
   - Users have USDC on Ethereum/Base/Polygon
   - Bridge it to Arc blockchain to use in marketplace
   - No need to use centralized exchanges

2. **Liquidity Provision**
   - Bring liquidity from other chains to Arc
   - Expand user base beyond Arc-native users

3. **Multi-Chain NFT Sales**
   - Sell NFTs on Arc, accept USDC from any chain
   - Auto-bridge payments to Arc for settlement

4. **Cross-Chain Marketplace**
   - Buy NFT on Arc with Ethereum USDC
   - Bridge happens automatically behind the scenes

### Important Notes

- ⚠️ **Wallet Required**: Requires MetaMask or compatible browser wallet
- ⚠️ **Gas Fees**: User pays gas on both source and destination chains
- ⚠️ **USDC Only**: Currently supports USDC transfers only
- ⚠️ **Time**: FAST ~15 min, SLOW ~30 min (network dependent)
- ✅ **Native USDC**: Uses Circle's native USDC (not wrapped tokens)

### Error Handling

```typescript
const { bridge, error } = useCircleBridge();

try {
  const result = await bridge({
    fromChain: 'Ethereum',
    toChain: 'Base',
    amount: '100.00',
  });

  if (result.state === 'error') {
    console.error('Bridge failed:', result.error);
    // Show user-friendly error message
  } else if (result.state === 'partial') {
    console.warn('Partial success:', result.steps);
    // Some steps succeeded, user can retry
  }
} catch (err) {
  console.error('Bridge error:', err);
}
```

## Smart Contract Platform (Advanced)

ArcMarket also integrates Circle's **Smart Contract Platform SDK** for programmatic contract deployment. This is useful for deploying NFT collections or custom marketplace contracts.

### Use Cases

- **Deploy NFT Collections**: Create ERC-721 or ERC-1155 contracts for users
- **Custom Marketplaces**: Deploy specialized marketplace contracts
- **Token Contracts**: Deploy ERC-20 tokens for rewards or governance
- **Automated Deployments**: Deploy contracts as part of your application workflow

### Setup

1. **Generate Entity Secret** (one-time setup):
   - Follow [Circle's Developer-Controlled Wallets QuickStart](https://developers.circle.com/interactive-quickstarts/dev-controlled-wallets)
   - Add to `.env.local`:
     ```env
     CIRCLE_ENTITY_SECRET=your_entity_secret_here
     ```

2. **Create Developer-Controlled Wallet**:
   - Use Circle Console or API to create a wallet for contract deployments
   - Fund the wallet with gas tokens for the target blockchain

### Usage

**Deploy a Contract:**

```typescript
// Frontend call
const response = await fetch('/api/circle/contracts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My NFT Collection',
    description: 'Limited edition NFT collection',
    walletId: 'developer-wallet-id',  // Your developer-controlled wallet
    abiJson: JSON.stringify(contractABI),  // Contract ABI
    bytecode: '0x60806040...',  // Compiled bytecode
    constructorParameters: ['Collection Name', 'SYMBOL', 10000],  // Constructor args
    feeLevel: 'MEDIUM',  // Gas fee level
  }),
});

const { contractId, contractAddress, transactionHash } = await response.json();
console.log('Contract deployed at:', contractAddress);
```

**Check Deployment Status:**

```typescript
const response = await fetch(`/api/circle/contracts?contractId=${contractId}`);
const { contract } = await response.json();

console.log('Deployment status:', contract.deployStatus);
// PENDING → IN_PROGRESS → SUCCESS
```

### Example: Deploy ERC-721 NFT Contract

```typescript
import { compile } from '@/lib/solidity-compiler';

// 1. Compile your Solidity contract
const compiled = await compile(`
  pragma solidity ^0.8.0;
  import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

  contract MyNFT is ERC721 {
    constructor(string memory name, string memory symbol)
      ERC721(name, symbol) {}
  }
`);

// 2. Deploy via Circle
const response = await fetch('/api/circle/contracts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My NFT Collection',
    walletId: process.env.DEVELOPER_WALLET_ID,
    abiJson: JSON.stringify(compiled.abi),
    bytecode: compiled.bytecode,
    constructorParameters: ['My NFT', 'MNFT'],
    feeLevel: 'HIGH',  // Faster deployment
  }),
});
```

### Important Notes

- ⚠️ **Server-Side Only**: Smart Contract Platform SDK requires `entitySecret` (server secret)
- ⚠️ **Developer-Controlled**: Uses your developer wallets, not user wallets
- ⚠️ **Gas Costs**: Your wallet pays for deployment gas fees
- ⚠️ **Blockchain Support**: Check Circle's docs for supported blockchains

### API Reference

**POST /api/circle/contracts**
- Deploy a new smart contract
- Returns: `contractId`, `contractAddress`, `transactionHash`, `deploymentStatus`

**GET /api/circle/contracts?contractId=xxx**
- Get deployment status and contract details
- Returns: Full contract information including deployment status

## Troubleshooting

### "Unauthorized - Please sign in"

**Cause**: NextAuth session not established
**Solution**: Ensure user is signed in via NextAuth before calling Circle APIs

### "Failed to create wallet"

**Possible Causes**:
1. Invalid Circle API key → Check `.env.local`
2. Circle user doesn't exist → Backend automatically creates users
3. Network error → Check Circle service status

### "userToken expired"

**Cause**: Circle user tokens expire after 1 hour
**Solution**: Call `/api/circle/auth/refresh` to refresh token

### "Challenge not completed"

**Cause**: User didn't complete PIN setup
**Solution**: Integrate Circle Web SDK to handle challenges

## Resources

**Circle Documentation:**
- **Main Docs**: https://developers.circle.com/w3s/docs
- **User-Controlled Wallets Guide**: https://learn.circle.com/quickstarts/user-controlled-wallets
- **Smart Contract Platform Guide**: https://developers.circle.com/w3s/smart-contract-platform
- **Developer-Controlled Wallets QuickStart**: https://developers.circle.com/interactive-quickstarts/dev-controlled-wallets
- **Circle Console**: https://console.circle.com/

**Other Resources:**
- **NextAuth Documentation**: https://next-auth.js.org/
- **ArcMarket Implementation Status**: See `IMPLEMENTATION_STATUS.md`

## Support

For Circle-specific issues:
- **Discord**: https://discord.com/invite/buildoncircle
- **Help Desk**: https://support.usdc.circle.com/
- **Email**: customer-support@circle.com

For ArcMarket issues:
- Check `IMPLEMENTATION_STATUS.md` for known limitations
- Review backend logs for API errors
- Verify environment variables are set correctly

---

**Last Updated**: 2025-11-18
**Status**: Backend SDK integrated, Web SDK integration pending
