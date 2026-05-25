# W16 — Operator go-live (source-of-truth post draft)

> **Status**: _draft, pending publication_.
> **Permalink (paste after publishing)**: _pending_.
> **Channels**: LinkedIn (primary), X/Twitter (secondary, threaded), tech-Twitter community signal-boost (optional).
>
> The text below is designed to copy-paste with minimal edits. The LinkedIn version uses the full post; the X version uses paragraphs 1–3 as a thread starter and links here.

---

## Post

**ARC is the trust layer for agent commerce. Live today.**

Forrester said it cleanest: "No human decision point exists between resource request and payment execution."

In agent commerce, the work a human would have done — KYC the counterparty, score the contract, verify the operator — happens in advance, by infrastructure, or it doesn't happen at all. ARC ships that infrastructure: an MCP server that any Claude / Codex / Cursor / Bazaar-aware agent can call before transacting, a pay-per-call trust-read API priced at $0.01 / $0.05, and an ERC-8004-aligned identity primitive backed by a counsel-led attestation registry.

We're rail-agnostic by design. The rail wars (Coinbase / Circle's x402 vs Mastercard Payment Protocol post-BVNK) are not where value accrues for the trust layer — the trust layer is the asset. The hosted trust-api settles in USDC on Base mainnet via x402 today; MPP is staged as a recognised first-class rail in the same `accepts[]` quote. Adding a new rail is a config flag.

**Try it:**

- MCP: `https://arc-mcp-server.fly.dev/mcp` (Streamable HTTP, three tools: `arc_trust_read`, `arc_search`, `arc_passport_get`)
- HTTP: `POST https://arc-trust-api.fly.dev/v1/trust/read` returns a 402 quote you can settle
- Skill bundle: `skills/use-arc-trust/` (drop into any Claude Code / Cursor / Codex config)

**The MENA institutional posture matters.** DFSA's Crypto Token framework (Jan 2026) and ADGM's FRT regime require firms to document token suitability and stablecoin reserve composition. ARC's `token.suitability.v1` and `stablecoin.reserves.v1` schemas map directly onto those evidentiary burdens. The W12 MENA evidence-object composes all five attestation schemas into a single verifiable JSON envelope — counsel-review-pending; design partners welcome.

Open-source: contracts, schemas, SDKs. Closed: the hosted offering. Portable: every attestation envelope is JSON-conformant to `arc.evidence.mena.v1` so any operator running the same Solidity surface plus the `@arc/attestations` package can read ARC-anchored attestations without ARC's permission.

GitHub: github.com/archon-444/arc
Branch: `claude/trust-layer-agents-sNcay`
Strategic frame: STRATEGIC_PIVOT.md + docs/strategic-environment.md

---

## Word count target

~360 words above the GitHub line. Keeps LinkedIn within its "see more" fold and gives X a thread-able structure (5 short paragraphs).

## Post-publish steps

1. Publish to LinkedIn from the founder account. Copy the post permalink and paste it into the "Permalink" line at the top of this file.
2. Thread the first three paragraphs on X with a link back to LinkedIn (X struggles with 360 words; thread is better than truncation).
3. Cross-post to relevant Slack/Discord communities (Anthropic builders, Circle Arc, x402 working group) with a short framing tweet and the LinkedIn permalink.
4. Update `README.md` "Status" section to replace the `_pending W16 deploy_` placeholder with the live URLs.
5. Update `docs/strategic-environment.md` "Cross-references" to link the live post permalink.

## What this post deliberately does NOT do

- Promise SDK integrations that don't yet exist (Privy/Bridge integration payloads are W17.4 — referenced in the post only by their narrative position, not as live partnerships).
- Claim regulatory compliance. The MENA schemas are counsel-review-pending; the post says so.
- Promise an Arc mainnet timeline. Arc mainnet is upside, not a dependency — the post deliberately omits any "Arc mainnet coming soon" framing because that would compete with the rail-agnostic positioning.
- Disclose pricing for the design-partner program. Conversation, not price list, in the first call.

## Cross-references

- [`README.md`](../../README.md) — links this draft after publication.
- [`STRATEGIC_PIVOT.md`](../../STRATEGIC_PIVOT.md) — the full pivot rationale this post compresses to 360 words.
- [`docs/strategic-environment.md`](../strategic-environment.md) — the canonical Forrester / rail-agnostic / acquirer framing the post leads with.
- [`docs/mena/outreach-template.md`](../mena/outreach-template.md) — the parallel cold-outreach for DIFC firms (W16 acceptance item 4).
