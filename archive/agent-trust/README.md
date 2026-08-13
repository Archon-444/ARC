# Archived: agent-commerce experiment (moved)

This folder is a **pointer**, not a product. The code does not live in ARC.

## What this was

A Claude agent rebuilt ARC as an editorial trust layer for agent commerce (x402 paywall, MCP server, ArcPassport, attestations). That work lived on:

- `claude/trust-layer-agents-sNcay` (full W1–W17 tree)
- `claude/assess-pre-launch-status-vilK3` (PR #82 merge destination)

It is a different buyer, ritual, and money path from the token launcher. Same dual-home smell as KasPump + ARC.

## Where it went

**[Archon-444/AgentTrust](https://github.com/Archon-444/AgentTrust)** — independent repo. History was pushed from the trust-layer branch (not copy-pasted). Further work happens there.

## What won here

See [`PRODUCT.md`](../../PRODUCT.md). **ARC is a USDC-native token launcher.** Root Directory for Vercel is `frontend/`, not `apps/web`.

## Do not

- Merge those Claude branches into ARC `main`
- Add `apps/web` on ARC so a leftover Vercel setting succeeds
- 308 `/launch` or `/token` to a trust/passport product
- Treat `STRATEGIC_PIVOT.md` or Forrester/x402 docs as ARC roadmap
