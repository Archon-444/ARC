# ARC product direction

KasPump mothballed because there were no named launchers and the UI explained a protocol instead of paying a creator. ARC was the leftover “maybe.” This file is how we improve *this* product without repeating that loop.

## What ARC is

A **USDC-native token launcher** on Circle Arc: launch a coin, share a link, trade on the curve. Not an OpenSea clone with a launchpad tab.

NFT studio, listings, auctions, XP, and rewards stay in the repo as a library. They are not the product.

## Thesis (say it in the first sentence)

**Creators earn on every trade. Traders buy a live curve. Unsold supply cannot be yanked as a rug.**

That is KasPump wedges B + C, ported here:

| Claim | On-chain meaning |
|---|---|
| Paycheck | 50% of the 2.5% trade fee accrues to the creator; they pull it. Not graduation-only. |
| Cannot-rug | No AMM `emergencyWithdraw` of USDC. Curve funds stay for sellers / graduation split. |
| Honest graduation | 80% sold → 50% remaining USDC to creator, 25% stakers, 25% platform. Trading on this AMM stops. There is no DEX yet. |

Do not advertise “fair launch / no team allocation” — graduation is a team check if they sell the curve. Say that out loud.

## One ritual

1. **Launch** — name, ticker, image, description. Curve stays behind Advanced.
2. **Share** — token URL.
3. **Trade** — one buy/sell surface with a real quote and minOut.

Home and Explore are a **board of coins**. Stats, rewards, studio, and “shell continuity” are not part of that ritual.

## What we stop building

- NFT marketplace parity (OpenSea GAP file is a tombstone, not a roadmap)
- Fake analytics, XP ranks, simulated studio mints presented as live
- Dual-home with KasPump or AgentTrust
- Racing 2026-09-16 without ten named people who will launch that week

## Next product slices (in order)

1. **Creator paycheck (this change)** — split the existing 2.5% fee; withdraw on the token page. Shipped.
2. **Leftover 20% supply** — burn, or keep a post-grad market. Do not leave it unexplained in the AMM.
3. **Wrong-network banner + human contract errors** — first-session failures.
4. **Park NFT in the shell** — nav/home default to tokens; studio/stats/rewards labeled parked/demo. Shipped for shell; studio mint is still simulated.
5. **Ten names** — distribution is a workstream. Code does not invent a room.

If the UI and this file disagree, this file wins until we change it on purpose.

## Track

| Track | Status |
|---|---|
| **Launcher (good)** | Live: `PRODUCT.md`, launch → token page → explore tokens, creator paycheck on-chain |
| **Unconstant (archived)** | OpenSea parity + connected-shell unification. Historical only: `archive/unconstant-product/` |
| **AgentTrust (separate repo)** | Trust / x402 / passport experiment moved to [Archon-444/AgentTrust](https://github.com/Archon-444/AgentTrust). Pointer: `archive/agent-trust/`. Do not merge it back. |
