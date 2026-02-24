# ArcMarket dApps Alignment Review: Code vs Documentation

**Date:** February 23, 2026
**Reviewer:** Claude Code
**Scope:** Full-stack review of smart contracts, frontend, backend, subgraph, docs
**Overall Alignment Score: ~82%** (documentation claims 90-95%)

---

## Executive Summary

After a thorough review of the entire ArcMarket codebase against all 33 documentation files, the project has **solid architecture and well-written code** but suffers from **significant documentation drift**, **disconnected backend services**, and **several open security issues**. The smart contracts and frontend hooks are well-aligned, but the integration layer has critical gaps.

### Headline Findings

| Category | Score | Key Issue |
|----------|-------|-----------|
| Smart Contracts | 95% | Quorum bug in SimpleGovernance; duplicate v0.1/v0.2 contracts |
| Frontend Components | 90% | Component names differ from docs; all hooks properly implemented |
| Frontend-Contract Integration | 95% | Hooks correctly map to ABIs; wagmi config correct |
| Subgraph | 80% | ArcTokenFactory address is zero - token launcher cannot index |
| Backend API | 40% | Exists but **not connected to frontend**; in-memory only |
| Documentation Accuracy | 60% | GAP_ANALYSIS percentages outdated; INTEGRATION_GUIDE doesn't match code |
| Security Posture | 70% | 6 open findings including 2 HIGH severity |
| Testing | 95% | Exceeds claims; docs severely undercount actual tests |
| CI/CD | 95% | 3 well-configured GitHub Actions workflows |

---

## 1. Smart Contracts: Code vs Documentation

### 1.1 Verified & Correct

| Feature | Doc Claim | Code Location | Status |
|---------|-----------|---------------|--------|
| Fixed-price listings | Yes | `ArcMarketplace.sol:140-168` | PASS |
| English auctions | Yes | `ArcMarketplace.sol:306-340` | PASS |
| USDC-only payments | Yes | `ArcMarketplace.sol:26` | PASS |
| 2.5% platform fee | Yes | `ArcMarketplace.sol:29` (250 bps) | PASS |
| Anti-sniping (10 min, max 5) | Yes | `ArcMarketplace.sol:365-370` | PASS |
| Tiered fee discounts | Yes | `ArcMarketplace.sol:450-464` | PASS |
| ReentrancyGuard | Yes | All state-changing functions | PASS |
| Pausable | Yes | `ArcMarketplace.sol:8` | PASS |
| Fee distribution (collection + global splits) | Yes | `FeeVault.sol:121-159` | PASS |
| Staking tiers (100/500/2k/10k USDC) | Yes | `StakingRewards.sol:63-88` | PASS |
| Fee discounts (10/20/35/50%) | Yes | `StakingRewards.sol:210-221` | PASS |
| Token factory $25 fee | Yes | `ArcTokenFactory.sol:63` | PASS |
| Bonding curve binary search | Yes | `ArcBondingCurveAMM.sol:320-343` | PASS |
| 80% graduation threshold | Yes | `ArcBondingCurveAMM.sol:180` | PASS |
| Graduation split (50/25/25) | Yes | `ArcBondingCurveAMM.sol` | PASS |
| Solidity 0.8.24 | Yes | `hardhat.config.js:7` | PASS |
| Arc testnet chain ID 5042002 | Yes | `hardhat.config.js:22` | PASS |
| 7-day governance voting | Yes | `SimpleGovernance.sol:57` | PASS |
| 1000 USDC to propose | Yes | `SimpleGovernance.sol:58` | PASS |

### 1.2 Issues Found

| ID | Severity | Issue | Details |
|----|----------|-------|---------|
| **SC-1** | **HIGH** | SimpleGovernance quorum not enforced | `QUORUM_PERCENTAGE = 10` is defined at line 59 but **never checked** in `finalizeProposal()`. Only checks `votesFor > votesAgainst` without validating minimum participation. ArcGovernance.sol (v0.1) properly enforces quorum. |
| **SC-2** | **MEDIUM** | Duplicate staking contracts | `ArcStaking.sol` (v0.1, with leaderboard) and `StakingRewards.sol` (v0.2, deployed) both exist. Creates confusion about which is canonical. |
| **SC-3** | **MEDIUM** | Duplicate governance contracts | `ArcGovernance.sol` (v0.1, with quorum enforcement + collection curation) and `SimpleGovernance.sol` (v0.2, deployed but missing quorum). Governance regression. |
| **SC-4** | **LOW** | README references wrong filename | README.md and SECURITY_AUDIT.md reference `NFTMarketplace.sol` but actual file is `ArcMarketplace.sol`. |

**Recommendation:** Deploy `ArcGovernance.sol` instead of `SimpleGovernance.sol` to restore quorum enforcement. Keep `StakingRewards.sol` (cleaner design). Remove or archive the unused v0.1/v0.2 duplicates.

---

## 2. Frontend: Code vs Documentation

### 2.1 Verified & Correct

| Feature | Doc Claim | Verified | Status |
|---------|-----------|----------|--------|
| Next.js 16 + TypeScript | Yes | `next 16.0.3`, `typescript 5.9.3` | PASS |
| Wagmi 2 + Viem | Yes | `wagmi 2.19.4`, `viem 2.39.2` | PASS |
| RainbowKit | Yes | `@rainbow-me/rainbowkit 2.2.9` | PASS |
| Circle SDK (4 packages) | Yes | bridge-kit, user-wallets, smart-contract-platform, w3s-pw-web-sdk | PASS |
| Framer Motion | Yes | `framer-motion 12.34.3` | PASS |
| React Query | Yes | `@tanstack/react-query 5.90.10` | PASS |
| react-virtuoso | Yes | `react-virtuoso 4.12.0` | PASS |
| Typesense search | Yes | `typesense 3.0.1` | PASS |
| Recharts | Yes | `recharts 3.7.0` | PASS |
| Arc testnet config | Yes | Chain ID 5042002, USDC 6 decimals | PASS |
| All marketplace hooks | Yes | listItem, buyItem, cancelListing, createAuction, placeBid, endAuction | PASS |
| Token factory hooks | Yes | createToken, getAllTokens, getTokenConfig, creationFee | PASS |
| Bonding curve AMM hooks | Yes | buyTokens, sellTokens, calculateBuyReturn, calculateSellReturn | PASS |
| Circle Wallet Provider | Yes | Full social login, wallet management, challenge flow | PASS |
| GraphQL client | Yes | 11 comprehensive query functions with retry logic | PASS |
| Dark mode | Yes | ThemeProvider with localStorage + system preference | PASS |
| PWA manifest | Yes | Icons, standalone display, proper categories | PASS |
| Service worker | Yes | Cache-first static, network-first API, offline fallback | PASS |

### 2.2 Issues Found

| ID | Severity | Issue | Details |
|----|----------|-------|---------|
| **FE-1** | **MEDIUM** | PerformanceMonitor doesn't exist | INTEGRATION_GUIDE.md references `@/components/PerformanceMonitor`. Actual code uses `WebVitalsReporter` from `@/components/analytics/WebVitalsReporter`. |
| **FE-2** | **MEDIUM** | BottomNavigation not in layout | Component exists at `components/layout/BottomNavigation.tsx` but is NOT imported in `layout.tsx`. Mobile nav is embedded inside `Navbar.tsx` instead. |
| **FE-3** | **LOW** | PWA component name mismatch | Docs say `PWAInstallPrompt` from `@/components/pwa/PWAInstallPrompt`. Code imports `InstallPrompt` from `@/components/pwa/InstallPrompt`. |
| **FE-4** | **LOW** | SearchInput not integrated | INTEGRATION_GUIDE claims SearchInput is in Navbar. Actual search is via CommandPalette (Cmd+K) only. |
| **FE-5** | **LOW** | Contract addresses are placeholders | All addresses default to `'0x'` - fully dependent on `.env` variables. |

---

## 3. Subgraph: Code vs Documentation

### 3.1 Verified & Correct

| Feature | Status |
|---------|--------|
| Network: arc-testnet | PASS |
| ArcMarketplace data source + handlers | PASS |
| FeeVault data source + handlers | PASS |
| ProfileRegistry data source + handlers | PASS |
| ArcBondingCurveAMM template + handlers | PASS |
| All ABIs present in `/subgraph/abis/` | PASS |
| GraphQL schema matches frontend queries | PASS |
| 15 event handlers all implemented | PASS |

### 3.2 Issues Found

| ID | Severity | Issue | Details |
|----|----------|-------|---------|
| **SG-1** | **CRITICAL** | ArcTokenFactory zero address | `subgraph.yaml:113` has address `0x0000000000000000000000000000000000000000`. Subgraph **cannot index** any token creation events. Token launcher feature is non-functional for indexing. |
| **SG-2** | **LOW** | Handler duplication | `mapping.ts` and `nft-marketplace.ts` both contain the same handler implementations. |

---

## 4. Backend: Code vs Documentation

### 4.1 What Exists

The `/backend/` directory contains a standalone Express.js REST API:
- 7 route modules (NFT, collections, offers, activity, search, analytics, users)
- WebSocket server with room-based subscriptions
- Wallet signature authentication with replay attack prevention
- Rate limiting (100 req/15 min)
- Helmet.js security headers + CORS
- OpenAPI 3.0 specification
- Health check endpoint

### 4.2 Critical Issues

| ID | Severity | Issue | Details |
|----|----------|-------|---------|
| **BE-1** | **CRITICAL** | Backend not connected to frontend | Frontend uses GraphQL (subgraph) + Next.js API routes. Zero REST API calls to backend's `/v1/*` endpoints. The backend exists as a **completely standalone, unused service**. |
| **BE-2** | **HIGH** | In-memory storage only | Backend uses in-memory data storage. All data lost on restart. PostgreSQL + Prisma documented as "future" but not implemented. |
| **BE-3** | **HIGH** | WebSocket is mock in frontend | `frontend/src/lib/websocket.ts` contains mock implementation. Backend WebSocket server exists but frontend doesn't connect to it. |
| **BE-4** | **MEDIUM** | Undocumented in main README | Main README architecture section doesn't mention the backend directory at all. |

**Recommendation:** Either integrate the backend Express server into the frontend data flow (replacing some Next.js API routes) or remove it to reduce confusion. The current state where it exists but is unused is misleading.

---

## 5. Security: Open Findings

All 6 actionable findings from SECURITY_AUDIT.md remain status assessment:

| ID | Severity | Issue | Current Status |
|----|----------|-------|---------------|
| SEC-01 | **HIGH** | IDOR in token refresh endpoint | **PARTIALLY FIXED** - `requireSessionUser()` guard added to some endpoints but needs verification |
| SEC-02 | **HIGH** | 15 npm vulnerabilities (5 high, 10 moderate) | **OPEN** - `bigint-buffer` via Circle bridge-kit has no fix available |
| SEC-03 | MEDIUM | Session validation gaps on wallet endpoints | **PARTIALLY FIXED** - Some endpoints have ownership checks, others don't |
| SEC-04 | MEDIUM | Error information disclosure to clients | **PARTIALLY MITIGATED** - Some endpoints still return detailed error objects |
| SEC-05 | MEDIUM | No distributed rate limiting | **OPEN** - In-memory rate limiting only; TODO comment says "Move to Redis" |
| SEC-06 | LOW | Console logging of sensitive data | **OPEN** - UserIDs, challengeIDs still logged |

**Additional security note:** SECURITY_AUDIT.md SEC-08 references `NFTMarketplace.sol` but the actual contract is `ArcMarketplace.sol`.

---

## 6. Testing: Documentation vs Reality

### 6.1 Actual Test Counts

| Layer | Doc Claims | Actual Count | Discrepancy |
|-------|-----------|--------------|-------------|
| Frontend unit tests | 112 | **160** (5 files: NFTCard, Badge, Button, EmptyState, Modal) | +43% underreported |
| E2E test cases | 37 | **198** (7 spec files: accessibility, explore, homepage, marketplace, navigation, pwa, search) | +435% severely underreported |
| Contract test files | 5 | **5** (with 1,354 individual test cases) | Correct |
| CI/CD workflows | 1 implied | **3** (ci.yml, e2e.yml, deploy.yml) | Underreported |

### 6.2 Testing Gaps

- Only **5 frontend unit test files** exist - no tests for hooks, utilities, providers, or API routes
- Jest coverage threshold set at 50% (could be higher)
- Contract tests are comprehensive (1,354 tests across marketplace, factory, governance, staking)

---

## 7. Documentation: Internal Contradictions

### 7.1 GAP_ANALYSIS.md Section Percentages vs Reality

The section-level completion percentages were never updated after implementation:

| Section | Claimed % | Actual Status | Real Estimate |
|---------|-----------|---------------|---------------|
| Smart Contracts | 75% | All documented contracts exist and work | ~90% |
| Technical Stack | 90% | Claims virtual scrolling missing - it IS installed | ~95% |
| Design System | 40% | Claims dark mode incomplete - it IS working | ~85% |
| Homepage UI | 50% | Claims no empty states - EmptyState EXISTS | ~80% |
| Collection Pages | 15% | Claims no filtering - FilterPanel IS built | ~85% |
| Search | 10% | Claims not implemented - Typesense + Cmd+K WORK | ~90% |
| User Profiles | 20% | Claims no social features - FollowButton EXISTS | ~60% |
| Mobile Experience | 25% | Claims no PWA - PWA IS fully working | ~90% |
| Performance | 20% | Claims no virtual scrolling - react-virtuoso INSTALLED | ~85% |
| Accessibility | 15% | Claims no ARIA - SkipLinks + LiveRegion EXIST | ~85% |

**The roadmap checkboxes below each section correctly show "COMPLETED"** but the headline percentages create a misleading first impression of the project being far less complete than it actually is.

### 7.2 INTEGRATION_GUIDE.md vs Actual Architecture

| Doc Recommends | Code Actually Does |
|----------------|-------------------|
| `<SkipLinks>` (plural) in layout | Uses `<SkipLink>` (singular) from different import |
| `<PerformanceMonitor>` component | Uses `<WebVitalsReporter>` |
| `<PWAInstallPrompt>` | Uses `<InstallPrompt>` from different path |
| `<BottomNavigation>` as separate layout component | Embedded inside `<Navbar>` |
| `<SearchInput>` in Navbar | Search handled via `<CommandPalette>` (Cmd+K) |
| Custom `WalletContext.tsx` with raw ethers.js | Uses wagmi + RainbowKit + Circle SDK Provider |
| REST API client at `lib/api/client.ts` | GraphQL via `graphql-client.ts` + Next.js API routes |

### 7.3 README.md Architecture Diagram

The architecture diagram in README.md is missing:
- The `backend/` directory entirely
- The `subgraph/` directory
- References `NFTMarketplace.sol` instead of `ArcMarketplace.sol`
- References `ArcStaking.sol` and `ArcGovernance.sol` but deployment uses `StakingRewards.sol` and `SimpleGovernance.sol`

---

## 8. Priority Action Items

### Critical (Blocks Production)

1. **Fix SimpleGovernance quorum enforcement** - Add quorum check to `finalizeProposal()` or switch deployment to use `ArcGovernance.sol`
2. **Fix ArcTokenFactory zero address in subgraph.yaml** - Update to actual deployed address so token launcher indexing works
3. **Decide on backend integration** - Either connect the Express backend to the frontend or remove it
4. **Fix SEC-01 IDOR vulnerability** - Verify all Circle auth endpoints have ownership checks
5. **Address npm vulnerabilities** - Run `npm audit fix`; evaluate `bigint-buffer` risk from Circle bridge-kit

### High Priority (Before Beta)

6. **Implement distributed rate limiting** - Migrate from in-memory to Redis/Upstash
7. **Connect WebSocket to backend** - Replace mock implementation with real real-time data
8. **Fix error information disclosure** - Sanitize all API error responses
9. **Remove/archive duplicate contracts** - Pick canonical staking and governance implementations

### Documentation Updates (Before Launch)

10. **Update GAP_ANALYSIS.md** section percentages to reflect actual completion
11. **Update README.md** architecture diagram to include backend and subgraph; fix contract filenames
12. **Update INTEGRATION_GUIDE.md** component names and architecture to match actual code
13. **Update test counts** across all docs (160 unit, 198 E2E, 1354 contract tests)
14. **Update SECURITY_AUDIT.md** to reference `ArcMarketplace.sol` not `NFTMarketplace.sol`
15. **Add "Production Readiness" section** to README clearly marking which features are real vs mock

---

## 9. Architecture Decision Required

### Staking: ArcStaking.sol vs StakingRewards.sol

| Feature | ArcStaking (v0.1) | StakingRewards (v0.2) |
|---------|-------------------|----------------------|
| Tier system | Enum-based | Struct array |
| Leaderboard | Yes (top 100) | No |
| Design | More features | Cleaner/simpler |
| Deployed? | No | **Yes** |

**Recommendation:** Keep StakingRewards.sol (v0.2) - cleaner design, already deployed.

### Governance: ArcGovernance.sol vs SimpleGovernance.sol

| Feature | ArcGovernance (v0.1) | SimpleGovernance (v0.2) |
|---------|---------------------|------------------------|
| Quorum enforcement | **Yes** | **No (BUG)** |
| Collection curation | Yes | No |
| Configurable params | Yes | Hardcoded |
| Deployed? | No | **Yes** |

**Recommendation:** Switch to ArcGovernance.sol (v0.1) - has critical quorum enforcement that v0.2 lost.

---

## 10. Revised Overall Assessment

| Metric | Documentation Claims | This Review Finds |
|--------|---------------------|-------------------|
| Overall completion | 90-95% | **~82%** |
| Production-ready | Yes (pending UAT) | **No** - security issues, mock WebSocket, disconnected backend, zero-address subgraph |
| OpenSea feature parity | 97.2% | **~80%** - offer system not connected, token launcher UI incomplete, analytics placeholder |
| Test coverage | 112 unit + 37 E2E | **160 unit + 198 E2E + 1,354 contract** (better than claimed) |

The project has excellent foundational architecture and the code quality is high where it exists. The primary gap is **integration completeness** - individual layers (contracts, frontend, subgraph, backend) are well-built but not fully wired together. Closing the integration gaps and fixing the security issues identified would genuinely bring this to production-ready status.

---

*Report generated: February 23, 2026*
*Files reviewed: 33 documentation files, 19 smart contracts, 50+ frontend files, 15 API routes, subgraph configuration, backend API*
