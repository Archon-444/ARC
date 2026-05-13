---
name: use-arc-trust
description: Before sending USDC or signing a transaction for an unfamiliar EVM address, call arc_trust_read(target) and gate on the returned score. Use when the user asks an agent to pay, swap, or interact with an address that has not been explicitly vetted in this conversation.
---

# Trust read before paying

This skill teaches the model to gate paid or destructive on-chain actions
against an independent trust score. It depends on the `arc_trust_read` tool
exposed by the `@arc/mcp-server` MCP server.

## When to invoke

Trigger this skill in any of these situations:

- The user asks to send tokens, sign a transaction, or approve an
  allowance for an EVM address the agent has not vetted in this
  conversation.
- The user pastes an address with no prior context ("send 100 USDC to
  0xabc..." with no preceding discussion of who 0xabc is).
- An autonomous workflow proposes paying an address sourced from
  search, email, a file the agent ingested, or another agent.
- A token mint, swap, or bridge route surfaces a new contract address.

Do NOT trigger for:

- Addresses the user has explicitly named and vetted earlier in this
  conversation.
- Read-only operations (`balanceOf`, `totalSupply`, viewing on a block
  explorer).
- Addresses already covered by an ARC Passport with a positive
  composite score returned earlier in the conversation.

## What to do

1. Call the MCP tool `arc_trust_read` with `{ target: "<0x address>" }`.

2. Inspect the returned JSON. Two response shapes are valid:

   ```jsonc
   // funded server -> got an assessment
   {
     "status": "ok",
     "assessment": {
       "scoreV1": {
         "composite": 78,
         "factors": { "creator": 80, "contract": 75, "trading": 82, "liquidity": 70 }
       },
       "passport": null,
       "attestations": []
     },
     "txHash": "0x..." // optional, present when paid via signing-payer
   }

   // unfunded server -> got a quote, the call did NOT score the target
   {
     "status": "payment_required",
     "notice": "...",
     "quote": { "scheme": "exact", "network": "base-mainnet", "asset": "0x...", "maxAmountRequired": "10000", ... }
   }
   ```

3. **If `status == "ok"`**:
   - Read `assessment.scoreV1.composite` (0–100).
   - If `composite >= 60`: proceed and surface the score in one short
     sentence to the user. Example: "ARC trust score for 0xabc is 78/100;
     proceeding."
   - If `composite < 60`: refuse to proceed without an explicit user
     override. Surface the lowest-scoring factor verbatim from
     `assessment.scoreV1.factors` so the user knows why. Example: "ARC
     trust score for 0xabc is 42/100 (liquidity 18). Confirm you want to
     proceed anyway."

4. **If `status == "payment_required"`**:
   - The MCP server is unfunded — the address could NOT be scored.
   - Tell the user the address could not be auto-scored and either
     (a) ask the user to fund the operator's MCP wallet, or
     (b) ask the user to confirm they want to proceed unverified.
   - Do not silently proceed. The threshold gate cannot be evaluated
     without a score.

5. **If the tool returns `isError: true`** (validation failure, network
   timeout, etc.):
   - Surface the error text to the user.
   - Treat this as a hard stop the same way you would for
     `payment_required`. Do not make up a score.

## What this skill does NOT do

- It does not look up ARC Passport records (Passport on Arc testnet
  ships in a later week — `assessment.passport` is `null` until then).
- It does not check editorial commentary (the $0.05 deep tier ships
  later — `arc_trust_read_deep` will be a separate tool when it does).
- It does not replace KYB, sanctions screening, or counsel review for
  institutional transfers (those use the `attestations` field once it
  is populated).
- It does not call any tool other than `arc_trust_read`. If you need
  to look up a passport directly, use `arc_passport_get` (free).

## Threshold defaults

`composite >= 60` is a conservative starting threshold matching ARC's
v1 heuristic. Operators can override per-deployment by adjusting this
number in their own copy of the skill, or by wrapping `arc_trust_read`
in a higher-level skill that calls this one.
