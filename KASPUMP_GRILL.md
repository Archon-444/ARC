# KasPump grill applied to ARC

Reviewed at HEAD of this branch. Same three axes as [KasPump #74](https://github.com/Archon-444/KasPump/issues/74): contract security, API/server security, frontend UX honesty.

KasPump is a bonding-curve token launcher. ARC’s launcher (`ArcTokenFactory` + `ArcBondingCurveAMM`) is the matching surface. NFT marketplace items are included when they share the same failure class (fabricated metrics, spoofable rate limits, unauthenticated fan-out).

This file is the tracker. Items marked **Fixed in this PR** shipped with the grill; the rest stay open.

## What's solid (verified, no action)

- ReentrancyGuard + CEI on AMM buy/sell; USDC `SafeERC20` (no native `.sendValue` fee path).
- Factory creation cooldown, input bounds, staker discount cap at 50%.
- Marketplace `setPlatformFee` is capped (`MAX_FEE`).
- Shared `Modal` already has `role="dialog"`, `aria-modal`, Escape, and a focus trap. Toasts already use `role="alert"`.
- Token page price / graduation / recent trades read the AMM (not `Math.random()`).
- No Uniswap V2/V3 graduation path, so KasPump’s pair dust-griefing (pre-seed reserves then hard-abort LP) does not apply. Graduation splits USDC 50/25/25 in-place.
- `feeVault` is paid in USDC, not ETH. A non-payable recipient cannot brick trades the way KasPump’s `sendValue` could. A USDC-reverting vault still would; FeeVault itself is a dumb holder.

## Mainnet blockers — Contracts

- [x] **Every AMM’s admin surface was permanently uncallable.** `ArcBondingCurveAMM` was `Ownable(msg.sender)` and deployed via `new` inside `ArcTokenFactory._deployAMM`, so the factory owned every AMM and had no `pause` forwarding. `pause()` / `unpause()` were dead in production. **Fix:** pass `owner()` into the AMM constructor. Tests now assert `amm.owner() == factory.owner()` after a factory deploy and that the owner can pause trading.
- [x] **No reserved emergencyWithdraw (and we did not add a rug).** KasPump’s second blocker was an owner withdraw that omitted curve reserves. ARC had no AMM `emergencyWithdraw` (good). Added `recoverStrayERC20` that cannot pull USDC or the launched token.
- [x] **64-iteration binary search could not reach graduation.** `calculateTokensOut` stopped ~43 wei short of an 18-decimal threshold (`800e18 / 2^64`). A follow-up buy then had `actualCost == 0` and reverted. **Fix:** 256 iterations + 1-unit dust charge when cost truncates.
- [x] **Graduating buys overcharged the full `usdcAmount`.** The curve cap did not reduce the USDC pull. **Fix:** charge `_cumulativeCost(tokensOut)` plus the 2.5% fee on that cost only.
- [x] **Post-graduation staking rewards silently died after the first claim.** `_calculateReward` subtracted lifetime `rewardsClaimed` after `claimStakingRewards` reset `stakingStartTime`. **Fix:** period-based reward from the last checkpoint.
- [ ] **FeeVault reverting still bricks every buy/sell + the graduating buy.** `usdc.safeTransfer(feeVault, platformFee)` is unwrapped on every trade. Wrap in try/catch / pull-payment, or freeze vault updates behind a timelock.
- [ ] **Graduation leaves 20% of supply stranded in the AMM.** Factory sends 100% of tokens to the AMM and graduates at 80%. After `isGraduated`, buy/sell revert; leftover tokens are not burned, not LP’d, not returned.
- [ ] **Exponential spot price does not match exponential cumulative cost.** `_priceAt` uses `basePrice + 2 * slope * S / PRECISION`. `_exponentialCumulativeCost` adds an extra cubic term. Align the integral with the spot function or drop the cubic term.

KasPump DEX dust-griefing: N/A (no DEX). TokenFactory EIP-170 size: not a blocker here; factory is much smaller than KasPump’s 32KB TokenFactory.

## High — API / Server

- [x] **Fabricated financial data on live APIs.** `/v1/analytics/*`, `/v1/activity`, `/v1/activity/token/:address`, NFT price-history, user stats, collection NFT lists used `Math.random()` / hardcoded Cool NFT as if they were real. **Fix:** empty/404 + `unavailable: true`.
- [x] **Unauthenticated token-activity broadcast.** `POST /v1/activity/token/broadcast` pushed arbitrary events into token rooms. **Fix:** require `TOKEN_BROADCAST_SECRET` via `x-broadcast-secret`; validate `tokenAddress`.
- [x] **Spoofable rate-limit IP.** Next.js guards and risk/AI routes keyed on the left-most `x-forwarded-for`. **Fix:** prefer `x-vercel-forwarded-for` / `cf-connecting-ip` / `x-real-ip`, else the right-most forwarded hop. Store is still in-memory (open, below).
- [x] **WebSocket subscribe had no room validation.** **Fix:** room ids must match `[a-zA-Z0-9:_-]{3,96}`.
- [x] **Backend bound the default interface only.** Render (and most PaaS) need `0.0.0.0:$PORT`. **Fix:** listen on `HOST` (default `0.0.0.0`).
- [x] **Circle `/api/circle/transaction` returned a random tx hash and fake CONFIRMED status.** **Fix:** `501 NOT_IMPLEMENTED`.
- [ ] **In-memory rate limits still no-op across serverless instances.** Same as KasPump. Needs Redis/Upstash before mainnet.
- [ ] **Comments are unsigned mock social** (`lib/mockSocial` + client-supplied address). Do not ship a real comment API without EIP-191 + server-derived identity.

## High — Frontend UX correctness

- [x] **Trades submitted `minOut = 0`.** Token page, `BuyTokenPanel`, `SellTokenPanel` defaulted to unprotected buys/sells. **Fix:** 1% slippage floor from the live quote; refuse to send until the quote exists.
- [x] **Creator social hrefs had no scheme allowlist.** **Fix:** shared `safeHttpUrl()` (http/https only).
- [x] **Offer table showed a random floor-difference %** that changed per render. **Fix:** em dash until real floor math exists.
- [x] **`useUserXP` invented XP, badges, and rank** (and re-randomized every 30s). **Fix:** honest zeros; no polling.
- [x] **WebSocket mock generator ran whenever `NEXT_PUBLIC_WS_URL` was unset**, including production. **Fix:** mock mode only when `NODE_ENV !== 'production'` and no WS URL.
- [x] **`LiveRegionProvider` existed but was never mounted.** **Fix:** wrap the app. Call sites still need wiring (open).
- [ ] **No wrong-network banner.** Add `isUnsupportedChain` + persistent switch prompt.
- [ ] **Contract errors are raw `error.message` slices**, not mapped. Add a `parseContractError` that actually reaches the UI.
- [ ] **Success copy says submitted after receipt success** on the token page. Split pending vs confirmed.
- [ ] **Studio mint still simulates with `setTimeout` + random addresses.** Hide or label as demo.
- [ ] **`announce()` is still called nowhere.** Bridge trade/error/network changes to the live region.

## Medium

- [x] **CI coverage script name was wrong.** `.github/workflows/ci.yml` runs `npm run coverage`; `package.json` only had `test:coverage`. **Fix:** added `coverage` alias.
- [ ] Exponential vs linear fee-split copy vs on-chain 2.5% — confirm UI copy matches `PLATFORM_FEE_BPS`.
- [ ] `useRecentTrades` scans up to 20k blocks per token page (RPC fan-out analogue). Cap / serve from subgraph.
- [ ] `framer-motion` does not honor `prefers-reduced-motion` app-wide.
- [ ] FeeVault / StakingRewards / SimpleGovernance `emergencyWithdraw` can drain the whole USDC balance (owner trust).
- [ ] Factory `pause()` does not pause existing AMMs (only new creates). Owner must call `amm.pause()` per market.

## Low / Informational

- [ ] Internal error details still leak on some Circle routes (SEC-04, partial).
- [ ] CSP still has `unsafe-inline` / `unsafe-eval` (Next + wallets).
- [ ] SECURITY_AUDIT.md is dated Nov 2025 and does not cover the token launcher. This file is the launcher-era review.
- [ ] LiveRegion 100ms clear can race screen-reader announcement (pre-existing).

## Suggested sequencing (remaining)

1. FeeVault-revert isolation + leftover 20% supply decision (product, then code).
2. Align exponential cost with spot price; add a golden-vector test.
3. Redis rate limit + wrong-network banner + contract-error mapping.
4. Wire `announce()` and pending/confirmed toasts.
5. Studio: stop presenting simulated mints as live.

## Mapping from KasPump PRs

| KasPump | ARC analogue in this PR |
|---|---|
| #75 AMM owner + emergencyWithdraw reserves + feeRecipient | Constructor owner + stray ERC20 recover (no USDC rug). FeeVault revert still open. |
| #81 / #87 de-fake metrics | Backend empty/404; XP zeros; offer % dash; Circle 501 |
| #86 signatures + rate limit + URL sanitize | Trusted IP + `safeHttpUrl`. Comments still mock. |
| #89 real minOut | 1% slippage from quote |
| #90 RPC fan-out | Documented; 20k-block trade fetch still open |
| #92 WS validation | Room id allowlist + broadcast secret |
| #82 CI actually runs | `coverage` script alias |
| #88 a11y | Mount LiveRegionProvider (Modal/Toast already ok) |
