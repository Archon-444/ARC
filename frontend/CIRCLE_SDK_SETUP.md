# Circle User-Controlled Wallets SDK Integration Guide

This guide explains how to set up and use Circle's User-Controlled Wallets in ArcMarket.

## Overview

ArcMarket integrates Circle's User-Controlled Wallets SDK to provide:
- **No MetaMask Required**: Users can create wallets using social login (Google, Facebook, Apple)
- **User-Controlled**: Users own their private keys via PIN/biometric authentication
- **Seamless Onboarding**: Familiar web2 login experience with web3 security

## Architecture

```
┌─────────────────┐
│  Frontend (React) │
│  - CircleWalletProvider │
│  - useCircleWallet()    │
└─────────┬───────┘
          │ HTTP
          ▼
┌─────────────────┐
│ Backend (Next.js API) │
│  /api/circle/auth     │
│  /api/circle/wallet   │
└─────────┬───────┘
          │ Circle SDK
          ▼
┌─────────────────┐
│  Circle API     │
│  - User Management    │
│  - Wallet Creation    │
│  - Token Generation   │
└───────────────── ┘
```

**Key Points:**
- ✅ Circle SDK runs **server-side only** in Next.js API routes
- ✅ Frontend calls our API routes, which call Circle's services
- ✅ User authentication via NextAuth (social login)
- ✅ Wallet operations require Circle user tokens

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

### Step 2: Configure Circle API Key

Edit `.env.local`:

```env
# Circle User-Controlled Wallets Configuration
CIRCLE_API_KEY=your_circle_api_key_here
```

⚠️ **Security Note**: `CIRCLE_API_KEY` does NOT have `NEXT_PUBLIC_` prefix, meaning it's server-side only and will never be exposed to the browser.

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

### 2. Generate API Key

1. Go to **API Keys** section
2. Click **Create API Key**
3. Copy the key immediately (it won't be shown again)
4. Add it to your `.env.local` file

### 3. Configure Webhooks (Optional)

For production, set up webhooks to receive wallet creation events:

1. Go to **Webhooks** section
2. Add endpoint: `https://yourdomain.com/api/circle/webhook`
3. Subscribe to events:
   - `wallet.created`
   - `transaction.created`
   - `transaction.confirmed`

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

- **Circle Documentation**: https://developers.circle.com/w3s/docs
- **User-Controlled Wallets Guide**: https://learn.circle.com/quickstarts/user-controlled-wallets
- **Circle Console**: https://console.circle.com/
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
