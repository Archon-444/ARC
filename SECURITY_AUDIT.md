# Security Audit Report: ARC NFT Marketplace

**Date:** November 25, 2025
**Auditor:** Claude Code
**Version:** 0.4
**Risk Rating:** MEDIUM

---

## Executive Summary

This security audit covers the ARC NFT Marketplace frontend and smart contracts. The audit identified several issues ranging from low to high severity that should be addressed before production deployment.

**Overall Assessment:** The codebase demonstrates good security practices in many areas (reentrancy guards, input validation, auth checks) but has several issues requiring attention.

---

## Findings Summary

| ID | Severity | Category | Status |
|----|----------|----------|--------|
| SEC-01 | HIGH | IDOR Vulnerability | Open |
| SEC-02 | HIGH | Dependency Vulnerabilities | Open |
| SEC-03 | MEDIUM | Session Validation Gap | Open |
| SEC-04 | MEDIUM | Error Information Disclosure | Open |
| SEC-05 | MEDIUM | Missing Rate Limiting | Open |
| SEC-06 | LOW | Console Logging of Sensitive Data | Open |
| SEC-07 | LOW | dangerouslySetInnerHTML Usage | Acceptable |
| SEC-08 | INFO | Smart Contract Best Practices | Advisory |

---

## Detailed Findings

### SEC-01: IDOR Vulnerability in Token Refresh Endpoint [HIGH]

**Location:** `frontend/src/app/api/circle/auth/route.ts:100-151`

**Description:** The GET endpoint for token refresh does not validate that the requesting user owns the userId being refreshed. Any authenticated user could potentially refresh tokens for another user.

**Vulnerable Code:**
```typescript
export async function GET(request: NextRequest) {
  // No session validation before using userId from query params
  const userId = searchParams.get('userId');
  const tokenResponse = await circleClient.refreshUserToken({
    userId,  // User-controlled without ownership verification
    refreshToken,
    deviceId,
  });
}
```

**Recommendation:**
```typescript
// Verify session user matches the userId being refreshed
const session = await getServerSession(authOptions);
if (!session || session.user.userId !== userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

### SEC-02: Dependency Vulnerabilities [HIGH]

**Description:** npm audit reports 15 vulnerabilities (10 moderate, 5 high).

**Key Vulnerabilities:**
- `bigint-buffer`: Buffer overflow vulnerability (HIGH) - No fix available
- `undici`: Insufficient random values & DoS via bad certificates (MODERATE)
- `@firebase/*`: Multiple vulnerabilities via undici dependency

**Recommendation:**
1. Run `npm audit fix` for auto-fixable issues
2. For `bigint-buffer` (via @circle-fin/bridge-kit), contact Circle for updates or evaluate if bridge-kit is essential
3. Monitor for updates and apply patches promptly

---

### SEC-03: Session Validation Gap [MEDIUM]

**Location:** Multiple API routes

**Description:** While most endpoints check for session existence, they don't verify the session user matches the resource being accessed (wallet ownership, user ID consistency).

**Affected Endpoints:**
- `POST /api/circle/wallet` - Creates wallet but doesn't verify userId matches session
- `GET /api/circle/wallet` - Returns wallets without ownership verification
- `PATCH /api/circle/wallet` - Updates wallet without full ownership check

**Recommendation:** Add explicit ownership verification:
```typescript
if (session.user.userId !== userId) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

---

### SEC-04: Error Information Disclosure [MEDIUM]

**Location:** All API routes

**Description:** Error responses include detailed Circle API error information that could leak internal system details.

**Example:**
```typescript
return NextResponse.json({
  error: 'Wallet creation failed',
  details: error.response.data  // Exposes internal error details
}, { status: 500 });
```

**Recommendation:**
- Log detailed errors server-side only
- Return generic error messages to clients
- Use error codes for client-side handling

```typescript
console.error('Circle API error:', error.response?.data);
return NextResponse.json({
  error: 'Operation failed',
  code: 'WALLET_CREATE_ERROR'
}, { status: 500 });
```

---

### SEC-05: Missing Rate Limiting [MEDIUM]

**Location:** All API routes

**Description:** No rate limiting is implemented on API endpoints, allowing potential abuse through:
- Brute force attacks on auth endpoints
- DoS through excessive API calls
- Enumeration attacks

**Recommendation:**
1. Implement rate limiting middleware (e.g., `@upstash/ratelimit`)
2. Add per-IP and per-user limits
3. Implement exponential backoff for failed auth attempts

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

---

### SEC-06: Console Logging of Sensitive Data [LOW]

**Location:** Multiple files

**Description:** Sensitive information is logged to console:
- User IDs and emails in auth callbacks
- Wallet creation challenge IDs
- Transaction details

**Examples:**
```typescript
console.log(`✅ Circle wallet creation initiated for user ${userId}, challengeId: ${challengeId}`);
console.log('[NextAuth] Sign in:', { user: user.email, provider: account?.provider });
```

**Recommendation:**
- Use a structured logging library (e.g., `pino`, `winston`)
- Configure log levels for production
- Redact sensitive fields

---

### SEC-07: dangerouslySetInnerHTML Usage [LOW - ACCEPTABLE]

**Location:** `frontend/src/components/seo/StructuredData.tsx`

**Description:** `dangerouslySetInnerHTML` is used for JSON-LD structured data injection.

**Assessment:** This is acceptable because:
1. Content is generated server-side from controlled data
2. `JSON.stringify()` escapes special characters
3. No user input is directly injected

**No action required** - current implementation is safe.

---

### SEC-08: Smart Contract Best Practices [INFO/ADVISORY]

**Location:** `contracts/contracts/NFTMarketplace.sol`, `contracts/contracts/FeeVault.sol`

**Positive Findings:**
- ✅ ReentrancyGuard used on state-changing functions
- ✅ Proper access control with Ownable
- ✅ Custom errors for gas efficiency
- ✅ Input validation (zero price checks, time range validation)
- ✅ SafeERC20 patterns not needed (USDC is trusted)

**Advisory Items:**
1. **Unchecked USDC transfers:** Consider using SafeERC20 for future token support
2. **No maximum fee cap:** `setProtocolFeeBps` has no upper bound
3. **Collection allowlist disabled:** Line 180 shows allowlist is commented out
4. **No pause mechanism:** Consider adding Pausable for emergencies

---

## Dependency Audit Details

```
# High Severity
bigint-buffer: Buffer Overflow via toBigIntLE() - No fix available
  └─ @circle-fin/bridge-kit → @solana/spl-token → bigint-buffer

# Moderate Severity
undici 6.0.0-6.21.1: Insufficient random values, DoS via bad certificates
  └─ firebase → @firebase/auth → undici
```

---

## Security Headers Review

**Current Implementation:** ✅ Good
- HSTS configured
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection enabled
- Referrer-Policy configured
- Permissions-Policy restricts sensitive APIs

**Recommendation:** Add Content-Security-Policy header:
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}
```

---

## Environment Variables Audit

**Sensitive Variables (Server-side only):**
- ✅ `CIRCLE_API_KEY_*` - Not exposed to client
- ✅ `CIRCLE_ENTITY_SECRET_*` - Not exposed to client
- ✅ `GOOGLE_CLIENT_SECRET` - Not exposed to client
- ✅ `NEXTAUTH_SECRET` - Not exposed to client

**Public Variables (Client-exposed):**
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Acceptable
- `NEXT_PUBLIC_TYPESENSE_API_KEY` - Should be search-only key
- `NEXT_PUBLIC_CIRCLE_APP_ID_*` - Acceptable (client identifier)

**Recommendation:** Ensure Typesense API key is a search-only key with limited permissions.

---

## Remediation Priority

### Immediate (Before Production)
1. **SEC-01**: Fix IDOR in token refresh endpoint
2. **SEC-03**: Add ownership verification to wallet endpoints
3. **SEC-04**: Remove detailed error exposure

### Short-term (Within 2 weeks)
4. **SEC-05**: Implement rate limiting
5. **SEC-02**: Apply available dependency fixes

### Medium-term (Within 1 month)
6. **SEC-06**: Implement structured logging
7. Add Content-Security-Policy header
8. Consider smart contract pause mechanism

---

## Appendix: Files Reviewed

### Frontend
- `src/app/api/circle/auth/route.ts`
- `src/app/api/circle/wallet/route.ts`
- `src/app/api/circle/wallets/route.ts`
- `src/app/api/circle/transaction/route.ts`
- `src/app/api/circle/contracts/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth-options.ts`
- `src/lib/circle-config.ts`
- `src/components/seo/StructuredData.tsx`
- `next.config.js`

### Smart Contracts
- `contracts/contracts/NFTMarketplace.sol`
- `contracts/contracts/FeeVault.sol`
- `contracts/contracts/ProfileRegistry.sol`

---

**Report Generated:** November 25, 2025
**Next Review:** Before mainnet deployment
