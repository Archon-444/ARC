# Circle Wallets Integration Guide

This document explains how the Circle User-Controlled Wallets are integrated into ArcMarket.

## Overview

Circle Wallets provide:
- **Easy onboarding** - No seed phrases, just PIN + biometric
- **USDC native** - Matches Arc's USDC gas token
- **Secure** - Circle's industry-leading infrastructure
- **Mobile-friendly** - Face ID / Touch ID support

## Architecture

### Backend (Next.js API Routes)

**API Routes** (`frontend/src/app/api/circle/`):
- `POST /api/circle/users` - Create Circle user account
- `POST /api/circle/wallets` - Create wallet challenge
- `GET /api/circle/wallets` - Get user's wallets

**API Configuration** (`frontend/src/lib/circle-api.ts`):
- Circle API base URL
- Authentication headers
- Error handling

### Frontend

**Hook** (`frontend/src/hooks/useCircleWallet.tsx`):
- `createUser()` - Creates Circle account via backend API
- `createWallet()` - Creates wallet with SDK challenge
- `executeChallenge()` - Executes PIN + biometric flow
- `refreshWallets()` - Fetches user's wallets
- `selectWallet()` - Switches active wallet

**UI Components** (`frontend/src/components/circle/`):
- `CreateWalletModal` - Guided wallet creation
- `WalletManagementModal` - Manage multiple wallets
- Navbar integration

## Setup

### 1. Get Circle Credentials

1. Sign up at [Circle Console](https://console.circle.com/)
2. Create a new App
3. Get your:
   - **API Key** (secret, backend only)
   - **App ID** (public, frontend)

### 2. Configure Environment

**Backend** (`.env.local`):
```env
CIRCLE_API_KEY=TEST_API_KEY:893eaabdc104600f02ebde79e6ac0650:92d541ef5263ea75ca41b5bc6637450b
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id_here
```

### 3. Supported Blockchains

Currently using **Polygon Amoy Testnet** (`MATIC-AMOY`) because:
- ✅ Supported by Circle
- ✅ Free testnet tokens
- ✅ Good for testing

**Arc blockchain** support:
- ⚠️ Not yet supported by Circle
- 📧 Contact Circle to request Arc support
- 🔄 Will switch when available

## User Flow

### First-Time User

1. **Click "Circle Wallet"** in Navbar
2. **Create Account**:
   - Backend calls `POST /api/circle/users`
   - Returns `userToken` + `encryptionKey`
   - SDK authenticates with tokens
3. **Create Wallet**:
   - Backend calls `POST /api/circle/wallets`
   - Returns `challengeId`
   - SDK shows PIN + biometric prompt
   - User completes challenge
   - Wallet created on blockchain
4. **Use Wallet**:
   - Buy NFTs
   - Place bids
   - Create listings

### Returning User

1. **Auto-login** from localStorage
2. **Select wallet** (if multiple)
3. **Transact** with PIN + biometric

## Transaction Signing

When user makes a transaction (buy, bid, etc.):

```typescript
// 1. Create transaction challenge
const challenge = await sdk.createTransaction({
  to: MARKETPLACE_ADDRESS,
  data: encodedFunctionData,
  blockchain: 'MATIC-AMOY',
});

// 2. User approves with PIN + biometric
const success = await sdk.execute(challenge.challengeId);

// 3. Transaction broadcast to blockchain
const txHash = await sdk.getTransactionStatus(challenge.challengeId);
```

## Security

### API Key Protection

- ✅ **Backend only** - NEVER expose in frontend
- ✅ **Environment variables** - Not in git
- ✅ **Next.js API routes** - Secure server-side calls

### User Tokens

- ✅ **Stored in localStorage** - Persistent sessions
- ✅ **Encrypted** - Circle's encryption
- ✅ **Scoped to user** - Can't access other users' wallets

### Challenges

- ✅ **PIN** - User sets 6-digit PIN
- ✅ **Biometric** - Face ID / Touch ID / Fingerprint
- ✅ **Time-limited** - Challenges expire
- ✅ **One-time use** - Can't replay

## Testing

### Local Development

```bash
# Start dev server
cd frontend
npm run dev

# Click "Circle Wallet" in navbar
# Creates test user + wallet
# Try transactions
```

### API Testing

```bash
# Create user
curl -X POST http://localhost:3000/api/circle/users \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123"}'

# Create wallet
curl -X POST http://localhost:3000/api/circle/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "userToken": "...",
    "blockchain": "MATIC-AMOY"
  }'

# Get wallets
curl "http://localhost:3000/api/circle/wallets?userId=test123&userToken=..."
```

## Troubleshooting

### "SDK not initialized"

**Cause**: `NEXT_PUBLIC_CIRCLE_APP_ID` not set

**Fix**: Add to `.env.local`:
```env
NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id
```

### "Failed to create user"

**Cause**: `CIRCLE_API_KEY` not set or invalid

**Fix**: Check backend `.env.local`:
```env
CIRCLE_API_KEY=TEST_API_KEY:...
```

### "Blockchain not supported"

**Cause**: Circle doesn't support Arc yet

**Current**: Using `MATIC-AMOY` (Polygon)

**Future**: Will switch to `ARC` when Circle adds support

### "Challenge execution failed"

**Cause**: User cancelled PIN/biometric prompt

**Fix**: User should retry and complete the flow

## Migration to Arc

When Circle supports Arc blockchain:

**Update** (`frontend/src/app/api/circle/wallets/route.ts`):
```typescript
blockchains: ['ARC'], // Change from 'MATIC-AMOY'
```

**Update** (`frontend/src/hooks/useCircleWallet.tsx`):
```typescript
blockchain: 'ARC', // Change from 'MATIC-AMOY'
```

**No frontend changes needed** - same UI/UX!

## Resources

- [Circle Docs](https://developers.circle.com/)
- [Circle Console](https://console.circle.com/)
- [W3S SDK Reference](https://developers.circle.com/w3s/docs/web-sdk-reference)
- [Supported Blockchains](https://developers.circle.com/w3s/docs/supported-blockchains)

## Next Steps

1. ✅ Setup complete
2. ✅ Backend API routes created
3. ✅ Real SDK integration (no mocks)
4. ⏳ Test on Polygon Amoy testnet
5. ⏳ Request Arc support from Circle
6. ⏳ Migrate to Arc when available

---

**Note**: This is a REAL integration - no mocks! All API calls hit Circle's actual infrastructure.
