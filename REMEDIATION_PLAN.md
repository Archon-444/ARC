# ARC Marketplace Remediation Plan

**Based on:** DAPPS_ALIGNMENT_REVIEW.md (Feb 23, 2026)
**Approach:** Run tests first to establish baseline, then fix code, then align documentation
**Branch:** `claude/review-dapps-alignment-TFyNy`

---

## Phase 0: Establish Baseline (Dev + Test)

Run all existing tests before any changes to capture pass/fail baseline.

### Step 0.1: Install Dependencies

```bash
# All three modules independently
cd /home/user/ARC/contracts && npm ci
cd /home/user/ARC/frontend && npm ci
cd /home/user/ARC/backend && npm ci
```

### Step 0.2: Run Contract Tests (baseline)

```bash
cd /home/user/ARC/contracts
npx hardhat compile          # Verify compilation
npx hardhat test             # Run all 1,354 test cases
```

**Expected:** All tests pass. Note any failures — those are pre-existing.

### Step 0.3: Run Frontend Tests (baseline)

```bash
cd /home/user/ARC/frontend
npm run type-check           # TypeScript verification
npm run lint                 # ESLint
npm test                     # Jest unit tests (160 tests across 5 files)
```

### Step 0.4: Run Frontend Build (baseline)

```bash
cd /home/user/ARC/frontend
npm run build                # Next.js production build
```

**Note:** E2E tests (`npx playwright test`) require a running dev server and browser binaries. Run only if CI environment supports it.

---

## Phase 1: Critical Code Fixes

### Fix 1.1: SimpleGovernance Quorum Enforcement (SC-1 — HIGH)

**File:** `contracts/contracts/SimpleGovernance.sol`
**Lines:** 175–190

**Current code (broken):**
```solidity
function finalizeProposal(uint256 proposalId) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.status == ProposalStatus.Active, "Proposal not active");
    require(block.timestamp > proposal.endTime, "Voting not ended");

    // Check if quorum met
    uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;

    if (proposal.votesFor > proposal.votesAgainst) {
        proposal.status = ProposalStatus.Passed;
    } else {
        proposal.status = ProposalStatus.Rejected;
    }

    emit ProposalFinalized(proposalId, proposal.status);
}
```

**Fixed code:**
```solidity
function finalizeProposal(uint256 proposalId) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.status == ProposalStatus.Active, "Proposal not active");
    require(block.timestamp > proposal.endTime, "Voting not ended");

    uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;

    // Enforce quorum: require QUORUM_PERCENTAGE of total staked to participate
    uint256 totalStakedAmount = stakingContract.stakedBalance(address(0));
    // If staking contract tracks totalStaked as a public variable, use low-level call:
    (bool success, bytes memory data) = address(stakingContract).staticcall(
        abi.encodeWithSignature("totalStaked()")
    );
    if (success && data.length >= 32) {
        totalStakedAmount = abi.decode(data, (uint256));
    }

    if (totalStakedAmount > 0 && totalVotes * 100 < totalStakedAmount * QUORUM_PERCENTAGE) {
        proposal.status = ProposalStatus.Rejected;
        emit ProposalFinalized(proposalId, proposal.status);
        return;
    }

    if (proposal.votesFor > proposal.votesAgainst) {
        proposal.status = ProposalStatus.Passed;
    } else {
        proposal.status = ProposalStatus.Rejected;
    }

    emit ProposalFinalized(proposalId, proposal.status);
}
```

**Why this approach:** `StakingRewards.sol` exposes `uint256 public totalStaked` (line 38). We use a low-level staticcall matching the pattern from `ArcGovernance.sol:271-278`, which is proven to work with the same staking contract.

**Add test to** `contracts/test/SimpleGovernance.test.js`:
```javascript
describe("Quorum Enforcement", function () {
    it("Should reject proposal when quorum not met", async function () {
        // Only user1 stakes and votes (small portion of total)
        const stakeAmount = ethers.parseUnits("1000", 6);
        await usdc.connect(user1).approve(stakingAddress, stakeAmount);
        await staking.connect(user1).stake(stakeAmount);

        // Other users stake but don't vote (creates large totalStaked)
        const bigStake = ethers.parseUnits("20000", 6);
        await usdc.connect(user2).approve(stakingAddress, bigStake);
        await staking.connect(user2).stake(bigStake);
        await usdc.connect(user3).approve(stakingAddress, bigStake);
        await staking.connect(user3).stake(bigStake);

        // Create and vote on proposal (only user1 votes)
        await governance.connect(user1).createProposal(
            0, // FeaturedCollection
            "Test proposal",
            nftAddress,
            0
        );

        await governance.connect(user1).vote(0, true);

        // Fast forward past voting period
        await time.increase(VOTING_PERIOD + 1);

        // Finalize — should be rejected due to quorum not met
        await governance.finalizeProposal(0);
        const proposal = await governance.proposals(0);
        expect(proposal.status).to.equal(2); // Rejected
    });

    it("Should pass proposal when quorum is met", async function () {
        const stakeAmount = ethers.parseUnits("10000", 6);
        await usdc.connect(user1).approve(stakingAddress, stakeAmount);
        await staking.connect(user1).stake(stakeAmount);
        await usdc.connect(user2).approve(stakingAddress, stakeAmount);
        await staking.connect(user2).stake(stakeAmount);

        await governance.connect(user1).createProposal(
            0, "Quorum test", nftAddress, 0
        );

        // Both users vote (>10% participation)
        await governance.connect(user1).vote(0, true);
        await governance.connect(user2).vote(0, true);

        await time.increase(VOTING_PERIOD + 1);
        await governance.finalizeProposal(0);

        const proposal = await governance.proposals(0);
        expect(proposal.status).to.equal(1); // Passed
    });
});
```

**Verify:** `cd contracts && npx hardhat test test/SimpleGovernance.test.js`

---

### Fix 1.2: Subgraph ArcTokenFactory Address (SG-1 — CRITICAL)

**File:** `subgraph/subgraph.yaml`, line 113
**Current:** `address: "0x0000000000000000000000000000000000000000"`

**Action:** This requires the actual deployed contract address. Two options:

**Option A** (if factory is deployed): Replace with actual address
```yaml
source:
  address: "0x<ACTUAL_DEPLOYED_ARCTOKEN_FACTORY_ADDRESS>"
  abi: ArcTokenFactory
  startBlock: <DEPLOYMENT_BLOCK_NUMBER>
```

**Option B** (if factory is NOT yet deployed): Add a comment and placeholder marker
```yaml
source:
  # TODO: Replace with actual ArcTokenFactory deployment address
  # Token launcher indexing is DISABLED until this is updated
  address: "0x0000000000000000000000000000000000000000"
  abi: ArcTokenFactory
  startBlock: 0
```

**Decision needed:** Check if ArcTokenFactory has been deployed to Arc testnet. If yes, get the address from deployment logs/scripts.

---

### Fix 1.3: Security — Error Information Disclosure (SEC-04 — MEDIUM)

**Files:** 25 `console.error` calls across 15 API route files (see list below)

**Pattern to fix:** Replace raw error logging with sanitized versions.

**Before (example from `circle/auth/route.ts:92`):**
```typescript
console.error('Circle auth error:', error);
```

**After:**
```typescript
console.error('Circle auth error:', error instanceof Error ? error.message : 'Unknown error');
```

**Files to update** (each `console.error` and `console.log` in API routes):
- `api/activity/route.ts:130`
- `api/circle/auth/route.ts:92,184`
- `api/circle/wallet/route.ts:97,202,283`
- `api/circle/wallets/route.ts:93,159`
- `api/circle/transaction/route.ts:72-75,85,145,213` (lines 72-75 log walletId, tx hash — remove)
- `api/circle/users/route.ts:65`
- `api/circle/contracts/route.ts:91,158`
- `api/ai/generate-token-page/route.ts:109`
- `api/rarity/[address]/route.ts:52,72`
- `api/cron/calculate-rarity/route.ts:117`
- `api/price-history/[collection]/[tokenId]/route.ts:29`
- `api/token/[address]/risk/route.ts:59`
- `api/nft-metadata/[collection]/[tokenId]/route.ts:25`

**Special attention:** `circle/transaction/route.ts:72-75` logs wallet IDs and transaction details to console. These MUST be removed or redacted for production.

**Verify:** `cd frontend && npm run build` (no runtime test needed, this is logging only)

---

### Fix 1.4: Security — Sensitive Console Logging (SEC-06 — LOW)

**File:** `api/circle/transaction/route.ts`, lines 72-75

**Remove these lines entirely:**
```typescript
console.log(`📤 Circle transaction executed from wallet ${walletId}`);
console.log(`   To: ${to}`);
console.log(`   Value: ${value || '0'}`);
console.log(`   Tx Hash: ${transactionHash}`);
```

Or replace with a non-sensitive summary:
```typescript
console.log('Circle transaction executed successfully');
```

---

## Phase 2: High Priority Fixes

### Fix 2.1: WebSocket — Replace Mock with Real Implementation (BE-3/FE — HIGH)

**File:** `frontend/src/lib/websocket.ts`

**Current:** 36 lines of mock that returns `[]` and claims `isConnected: true`

**Proposed replacement approach — connect to subgraph polling** (since backend WebSocket is disconnected):

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

export interface ActivityItem {
    type: 'sale' | 'listing' | 'offer' | 'transfer' | 'mint';
    price?: string;
    timestamp: number;
    nft: {
        id: string;
        name: string;
        image: string;
        collection: string;
    };
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function useRealtimeActivity(limit = 20) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            const response = await fetch(`/api/activity?limit=${limit}`);
            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
                setIsConnected(true);
            }
        } catch {
            setIsConnected(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchActivities();
        intervalRef.current = setInterval(fetchActivities, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsConnected(false);
        };
    }, [fetchActivities]);

    return { activities, isConnected };
}
```

**Why polling instead of WebSocket:** The backend WebSocket server exists but is not integrated. The `/api/activity` route already queries the subgraph. Polling is a practical bridge solution until a real WebSocket connection is established.

**Verify:** `cd frontend && npm run type-check && npm run build`

---

### Fix 2.2: Archive Duplicate Contracts (SC-2, SC-3 — MEDIUM)

**Action:** Move deprecated contracts to an `archive/` directory to prevent confusion.

```bash
mkdir -p contracts/contracts/archive
mv contracts/contracts/ArcStaking.sol contracts/contracts/archive/
# Keep ArcGovernance.sol available as reference for quorum pattern
# but mark it clearly
```

Add a header comment to `ArcGovernance.sol`:
```
// ARCHIVED: This contract is kept as reference. SimpleGovernance.sol is the canonical governance contract.
// The quorum enforcement pattern from this contract has been ported to SimpleGovernance.sol.
```

**Verify:** `cd contracts && npx hardhat compile` (ensure archived contracts don't break compilation)

---

## Phase 3: Documentation Alignment

All documentation changes in this phase are text-only. No test runs needed per-change, but a final `npm run build` verifies nothing is broken.

### Fix 3.1: GAP_ANALYSIS.md — Update Section Percentages

**File:** `GAP_ANALYSIS.md`

Update each section's headline percentage to match verified reality:

| Section | Current | Update To |
|---------|---------|-----------|
| Smart Contracts | 75% | 90% |
| Technical Stack | 90% | 95% |
| Design System | 40% | 85% |
| Homepage UI | 50% | 80% |
| Collection Pages | 15% | 85% |
| Search & Discovery | 10% | 90% |
| User Profiles | 20% | 60% |
| Mobile Experience | 25% | 90% |
| Performance | 20% | 85% |
| Accessibility | 15% | 85% |

---

### Fix 3.2: INTEGRATION_GUIDE.md — Fix Component Names

**File:** `INTEGRATION_GUIDE.md`

| Find | Replace With |
|------|-------------|
| `PerformanceMonitor` | `WebVitalsReporter` |
| `@/components/PerformanceMonitor` | `@/components/analytics/WebVitalsReporter` |
| `PWAInstallPrompt` | `InstallPrompt` |
| `@/components/pwa/PWAInstallPrompt` | `@/components/pwa/InstallPrompt` |
| `SkipLinks` (plural) | `SkipLink` (singular) |
| `SearchInput` in Navbar section | `CommandPalette` (Cmd+K) |
| `BottomNavigation` as separate layout component | Note: embedded in Navbar |
| `WalletContext.tsx` with raw ethers.js | Note: uses wagmi + RainbowKit + Circle SDK |
| `lib/api/client.ts` REST client | `lib/graphql-client.ts` + Next.js API routes |

---

### Fix 3.3: README.md — Fix Architecture Section

**File:** `README.md`

Changes needed:
1. Replace `NFTMarketplace.sol` → `ArcMarketplace.sol` (all occurrences)
2. Replace `ArcStaking.sol` → `StakingRewards.sol` in architecture/deployment sections
3. Replace `ArcGovernance.sol` → `SimpleGovernance.sol` in architecture/deployment sections
4. Add `backend/` and `subgraph/` to directory structure
5. Add "Production Readiness" section noting:
   - WebSocket: polling-based (not true real-time yet)
   - Backend: standalone service, not connected to frontend
   - Token launcher: contracts exist, subgraph pending deployment address
   - Rate limiting: in-memory only, needs Redis for production

---

### Fix 3.4: SECURITY_AUDIT.md — Fix Contract References

**File:** `SECURITY_AUDIT.md`

Replace all occurrences of `NFTMarketplace.sol` with `ArcMarketplace.sol`.

---

### Fix 3.5: Update Test Count Documentation

**Files:** Any docs referencing test counts

Update to accurate numbers:
- Frontend unit tests: **160** (not 112)
- E2E test cases: **198** (not 37)
- Contract test cases: **1,354** across 5 files
- CI/CD workflows: **3** (ci.yml, e2e.yml, deploy.yml)

---

## Phase 4: Post-Fix Verification

### Step 4.1: Run Full Contract Test Suite

```bash
cd /home/user/ARC/contracts
npx hardhat compile
npx hardhat test
```

**Must pass:** All existing tests + new quorum tests from Fix 1.1.

### Step 4.2: Run Full Frontend Test Suite

```bash
cd /home/user/ARC/frontend
npm run type-check
npm run lint
npm test
npm run build
```

**Must pass:** All 160 unit tests, zero TypeScript errors, successful build.

### Step 4.3: Verify Contract Compilation After Archiving

```bash
cd /home/user/ARC/contracts
npx hardhat compile --force
```

---

## Phase 5: Commit and Push

### Commit Strategy (atomic commits per phase)

```
Commit 1: "fix: enforce quorum check in SimpleGovernance.finalizeProposal"
  - contracts/contracts/SimpleGovernance.sol
  - contracts/test/SimpleGovernance.test.js

Commit 2: "fix: mark ArcTokenFactory zero address with TODO in subgraph"
  - subgraph/subgraph.yaml

Commit 3: "fix: sanitize console logging in API routes (SEC-04, SEC-06)"
  - frontend/src/app/api/circle/transaction/route.ts
  - (all other API route files with console.error changes)

Commit 4: "fix: replace mock WebSocket with activity polling"
  - frontend/src/lib/websocket.ts

Commit 5: "chore: archive deprecated ArcStaking contract"
  - contracts/contracts/archive/ArcStaking.sol

Commit 6: "docs: align documentation with actual codebase"
  - GAP_ANALYSIS.md
  - INTEGRATION_GUIDE.md
  - README.md
  - SECURITY_AUDIT.md
```

### Push

```bash
git push -u origin claude/review-dapps-alignment-TFyNy
```

---

## Deferred Items (Require External Input)

| Item | Blocker | Owner |
|------|---------|-------|
| ArcTokenFactory actual address | Need deployment receipt or redeploy | DevOps |
| Redis/Upstash rate limiting (SEC-05) | Requires infrastructure provisioning | DevOps |
| npm audit fix for bigint-buffer (SEC-02) | Upstream Circle SDK dependency | Circle/Maintainer |
| Backend integration decision | Architecture decision: keep, integrate, or remove | Tech Lead |
| E2E test execution | Requires Playwright browsers + dev server | CI |

---

*Plan generated: February 23, 2026*
*Estimated implementation: ~6 commits, ~15 file changes*
