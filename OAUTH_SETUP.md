# OAuth Social Login Setup Guide

This guide explains how to set up Google, Facebook, and Apple OAuth for ArcMarket social login.

## Overview

ArcMarket uses **NextAuth.js** for OAuth authentication, enabling users to sign in with their social accounts and automatically create Circle wallets without seed phrases.

**Authentication Flow**:
1. User clicks "Sign in with Google/Facebook/Apple"
2. NextAuth redirects to OAuth provider
3. User authorizes the app
4. NextAuth receives user info (email, name)
5. Circle wallet is automatically created
6. User is signed in with wallet ready

## Prerequisites

- ArcMarket frontend running locally
- Access to developer consoles for each provider
- Valid redirect URLs configured

## NextAuth.js Configuration

### 1. Generate Secret Key

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Add to `.env.local`:
```env
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
```

For production, set `NEXTAUTH_URL` to your production URL.

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ArcMarket" → Create

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen (if prompted):
   - User Type: External
   - App name: ArcMarket
   - User support email: your email
   - Developer contact: your email
   - Save and continue through scopes/test users
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "ArcMarket Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)
5. Click "Create"
6. Copy **Client ID** and **Client secret**

### Step 4: Add to Environment

Add to `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Testing

- **Development**: Users can test immediately
- **Production**: Must verify domain ownership in Google Console

---

## Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select use case: "Authenticate and request data from users with Facebook Login"
4. App type: "Consumer"
5. Enter details:
   - App name: "ArcMarket"
   - Contact email: your email
6. Click "Create App"

### Step 2: Add Facebook Login Product

1. In dashboard, find "Facebook Login" product
2. Click "Set Up"
3. Select platform: **Web**
4. Enter Site URL: `http://localhost:3000` (development)
5. Save and continue

### Step 3: Configure OAuth Settings

1. Go to "Facebook Login" → "Settings"
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook` (development)
   - `https://your-domain.com/api/auth/callback/facebook` (production)
3. Save changes

### Step 4: Get App Credentials

1. Go to "Settings" → "Basic"
2. Copy **App ID** and **App Secret** (click "Show")

### Step 5: Add to Environment

Add to `.env.local`:
```env
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here
```

### Important Notes

- **App Review**: For production, you must submit for Facebook App Review
- **Test Users**: In development, only you and test users can sign in
- **Business Verification**: May be required for certain permissions

---

## Apple OAuth Setup

⚠️ **Note**: Apple OAuth is more complex and requires:
- Apple Developer Program membership ($99/year)
- Domain ownership verification
- Additional configuration steps

### Step 1: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" → "App IDs"
4. Select "App" → Continue
5. Enter:
   - Description: "ArcMarket"
   - Bundle ID: `com.arcmarket.app` (your choice)
6. Enable "Sign in with Apple" capability
7. Click "Continue" → "Register"

### Step 2: Create Service ID

1. Click "Identifiers" → "+" → "Services IDs"
2. Enter:
   - Description: "ArcMarket Web"
   - Identifier: `com.arcmarket.web` (your choice)
3. Enable "Sign in with Apple"
4. Click "Configure":
   - Primary App ID: Select your App ID from Step 1
   - Web Domain: `your-domain.com` (no http://)
   - Return URLs:
     - `https://your-domain.com/api/auth/callback/apple`
   - **Note**: Apple does NOT support localhost for OAuth
5. Click "Save" → "Continue" → "Register"

### Step 3: Create Private Key

1. Go to "Keys" → "+" → Select "Sign in with Apple"
2. Enter key name: "ArcMarket Apple Key"
3. Configure "Sign in with Apple": Select your Primary App ID
4. Click "Continue" → "Register"
5. Download the `.p8` private key file (save it securely!)
6. Note your:
   - **Key ID** (10-character string)
   - **Team ID** (found in top-right of developer portal)

### Step 4: Generate Client Secret

Apple requires you to generate a JWT as the client secret.

**Option A**: Use NextAuth's built-in generator (recommended):
```bash
npm install --save-dev jsonwebtoken
```

**Option B**: Use manual script:
```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('/path/to/AuthKey_XXXXXXX.p8');

const clientSecret = jwt.sign(
  {
    iss: 'YOUR_TEAM_ID',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 180 days
    aud: 'https://appleid.apple.com',
    sub: 'com.arcmarket.web', // Your Service ID
  },
  privateKey,
  {
    algorithm: 'ES256',
    keyid: 'YOUR_KEY_ID',
  }
);

console.log(clientSecret);
```

### Step 5: Add to Environment

Add to `.env.local`:
```env
APPLE_CLIENT_ID=com.arcmarket.web
APPLE_CLIENT_SECRET=your_generated_jwt_token_here
```

### Important Notes

- **Production Only**: Apple OAuth doesn't work with localhost
- **JWT Expiry**: Regenerate client secret every ~6 months
- **Domain Verification**: Must verify domain ownership with Apple

---

## Testing the Integration

### 1. Start the Development Server

```bash
cd frontend
npm run dev
```

### 2. Test OAuth Flow

1. Navigate to `http://localhost:3000`
2. Click "Circle Wallet" in navbar
3. Click "Sign in with Google" (or Facebook if configured)
4. Authorize the app in OAuth popup
5. Watch console logs for:
   - `[NextAuth] Sign in: ...`
   - `✅ OAuth + Circle wallet created: ...`
6. Verify wallet address is shown in UI

### 3. Check Session

```javascript
// In any Client Component
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  console.log('Session:', session);
  return <div>Welcome {session?.user?.email}</div>;
}
```

---

## Security Best Practices

### 1. Environment Variables

- **NEVER** commit `.env.local` to git
- Use different credentials for development/production
- Rotate secrets periodically

### 2. OAuth Scopes

Current scopes requested:
- **Google**: email, profile (basic info only)
- **Facebook**: email, public_profile
- **Apple**: email, name

### 3. HTTPS in Production

- **Always** use HTTPS for OAuth redirects in production
- Configure `NEXTAUTH_URL` with `https://` protocol
- Apple requires HTTPS (no exceptions)

### 4. CSRF Protection

- NextAuth.js includes built-in CSRF protection
- `NEXTAUTH_SECRET` must be strong and random
- Never share or expose `NEXTAUTH_SECRET`

---

## Troubleshooting

### "Redirect URI mismatch" error

**Cause**: OAuth redirect URL doesn't match configuration

**Fix**:
1. Check exact URL in error message
2. Ensure it matches your provider's settings EXACTLY
3. Include protocol (`http://` or `https://`)
4. Include path (`/api/auth/callback/google`)

### "Invalid client secret" (Apple)

**Cause**: JWT expired or malformed

**Fix**:
1. Regenerate JWT with script above
2. Check Key ID and Team ID are correct
3. Ensure `.p8` file is valid

### "App not approved for login" (Facebook)

**Cause**: App in development mode

**Fix**:
1. Add yourself as test user in Facebook App → Roles
2. For production, submit app for review

### NextAuth session not persisting

**Cause**: Missing `NEXTAUTH_SECRET` or `SessionProvider`

**Fix**:
1. Verify `NEXTAUTH_SECRET` is set in `.env.local`
2. Ensure `SessionProvider` wraps your app in `layout.tsx`

---

## Maintenance

### Rotate Secrets (Every 6-12 months)

1. **Google**: Generate new client secret in console
2. **Facebook**: Regenerate app secret (Settings → Basic → Reset App Secret)
3. **Apple**: Generate new JWT with updated expiry

### Monitor Usage

- Check OAuth provider dashboards for usage metrics
- Monitor failed auth attempts
- Review user feedback for auth issues

### Update Redirect URLs

When deploying to new domains:
1. Add new redirect URLs to ALL provider dashboards
2. Update `NEXTAUTH_URL` in production environment
3. Test auth flow on new domain

---

## Integration with Circle Wallets

After successful OAuth, the app automatically:

1. **Creates Circle User**: Calls `POST /api/circle/users`
2. **Generates Wallet**: Calls `POST /api/circle/wallets`
3. **Stores Session**: Saves user email and wallet address
4. **Enables Transactions**: User can now buy/sell NFTs

See `frontend/src/components/wallet/SocialLogin.tsx` for implementation details.

---

## Resources

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Guide](https://developers.facebook.com/docs/facebook-login/)
- [Apple Sign In Guide](https://developer.apple.com/sign-in-with-apple/)
- [Circle Wallets Docs](https://developers.circle.com/w3s/docs)

---

## Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check Next.js server logs (`npm run dev` terminal)
3. Verify all environment variables are set correctly
4. Test OAuth providers independently at:
   - Google: https://developers.google.com/oauthplayground
   - Facebook: https://developers.facebook.com/tools/debug/accesstoken/
5. Review NextAuth.js debug logs (enabled in development)

**Note**: OAuth setup can be tricky. Take your time with each provider and test thoroughly before moving to production.
