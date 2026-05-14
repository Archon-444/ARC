# Phase A — Operator Go-Live Runbook

> The 90-day implementation plan is complete in tree. Phase A is the
> operator-fired sequence that takes the branch from "interesting repo"
> to "live infrastructure": one Arc testnet deploy, one Base mainnet
> tx, one hosted trust-api, one hosted MCP server, one Bazaar listing,
> one captured agent → x402 → trust-read flow.
>
> **None of these steps are coding.** Every step is either a deploy
> command, a wallet operation, a configuration write, or a submission.
> If a step asks you to write code, stop and reach for `git blame` —
> something drifted.

End-state target:

1. Claude/Codex/Cursor MCP connected to a deployed ARC MCP server
2. Agent receives an unfamiliar EVM address
3. Agent calls `arc_trust_read`
4. x402 settles `$0.01` on Base mainnet USDC
5. ARC returns scoreV1 + Passport + attestations
6. Agent decides whether to proceed

That's V1.

---

## Pre-flight (one-time)

- Funded Arc testnet wallet (deployer key) with native gas
- Funded Base mainnet wallet (tiny — $10–20 ceiling) for the signing-payer
- Fly CLI installed + authenticated (`fly auth login`)
- Anthropic API key with credit (optional; flips deep tier from stub
  to live Haiku 4.5)
- Coinbase x402 Bazaar onboarding instructions checked for the
  current submission flow (form / PR / API — varies between weeks)

Set up `contracts/.env`:

```ini
PRIVATE_KEY=0x...                       # Arc testnet deployer
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

---

## Step 1 — Deploy Passport on Arc testnet

```sh
npm --workspace contracts run deploy:passport:arc-testnet
```

Captures:
- `ArcIdentityAdapter` address
- `ArcPassport` address (grants `REGISTRAR_ROLE` on the adapter atomically)
- Optional `COUNSEL_ROLE` grant if `PASSPORT_COUNSEL_ADDRESS` is set

Copy the printed addresses into `contracts/docs/PASSPORT.md`
"Known deployments" table.

## Step 2 — Deploy AttestationRegistry + Reputation + Validation

```sh
# Optionally pre-seed role grants:
#   ATTESTATION_ATTESTER_ADDRESS=0x... (server-side attester signer)
#   REPUTATION_FEEDBACK_ADDRESS=0x...   (feedback signer)
#   VALIDATION_VALIDATOR_ADDRESS=0x... (validator signer)
npm --workspace contracts run deploy:trust-suite:arc-testnet
```

Output ends with a copy-paste env block:

```ini
ARC_ATTESTATION_REGISTRY_ADDRESS=0x...
ARC_REPUTATION_ADAPTER_ADDRESS=0x...
ARC_VALIDATION_ADAPTER_ADDRESS=0x...
```

Hold these — Steps 4 + 6 need them. Also paste into
`contracts/docs/PASSPORT.md` for the operational ledger.

## Step 3 — Deploy trust-api to Fly

```sh
# One-time
fly apps create arc-trust-api --org personal

# Required secret
fly secrets set ARC_PAYTO=0x<your-base-mainnet-recipient> --app arc-trust-api

# Optional — flip reads to real on-chain state
fly secrets set ARC_RPC_URL=https://rpc.testnet.arc.network --app arc-trust-api
fly secrets set ARC_PASSPORT_ADDRESS=0x<from-step-1> --app arc-trust-api
fly secrets set ARC_ATTESTATION_REGISTRY_ADDRESS=0x<from-step-2> --app arc-trust-api

# Optional — flip deep tier to live Haiku 4.5
fly secrets set ARC_ANTHROPIC_API_KEY=sk-ant-... --app arc-trust-api

# Deploy
fly deploy --config apps/trust-api/fly.toml --dockerfile apps/trust-api/Dockerfile

# Smoke
curl https://arc-trust-api.fly.dev/v1/health
curl -i -X POST https://arc-trust-api.fly.dev/v1/trust/read \
  -H 'content-type: application/json' \
  -d '{"target":"0x0000000000000000000000000000000000000001"}'   # expect 402 + accepts[]
```

See [`apps/trust-api/DEPLOY.md`](../apps/trust-api/DEPLOY.md) for
rollback + checklist.

## Step 4 — Deploy MCP server to Fly

```sh
# One-time
fly apps create arc-mcp-server --org personal

# Required secret — point at the trust-api you just deployed
fly secrets set ARC_TRUST_API_URL=https://arc-trust-api.fly.dev --app arc-mcp-server

# Optional — signing-payer mode (lets agents trigger paid reads
# without holding a wallet themselves; the server signs).
# This is the funded wallet from pre-flight.
fly secrets set ARC_MCP_PAYER_PRIVATE_KEY=0x... --app arc-mcp-server

# Optional — gate /mcp behind a bearer token (off by default so the
# Bazaar crawler and Claude Desktop can probe it anonymously)
fly secrets set MCP_HTTP_AUTH_TOKEN=... --app arc-mcp-server

# Deploy
fly deploy --config apps/mcp-server/fly.toml --dockerfile apps/mcp-server/Dockerfile

# Smoke
curl https://arc-mcp-server.fly.dev/health
npx @modelcontextprotocol/inspector https://arc-mcp-server.fly.dev/mcp
```

See [`apps/mcp-server/DEPLOY.md`](../apps/mcp-server/DEPLOY.md).

## Step 5 — Fund the signing-payer wallet (Base mainnet)

The wallet whose private key is set as `ARC_MCP_PAYER_PRIVATE_KEY`
(Step 4) needs:

- Base mainnet USDC, e.g. $10–20 ceiling (one paid trust-read costs
  $0.01; 1000 reads = $10)
- Base mainnet ETH for gas (~$2 worth is plenty)

This is the operator wallet that will appear as `payer` in every
agent-initiated `arc_trust_read`. Do NOT use a recovery wallet here;
treat the key as compromisable and rotate quarterly.

## Step 6 — Run the live $0.01 settlement

From a host with `ARC_TEST_PRIVATE_KEY` set to the same key as Step 5
(or any other funded Base mainnet wallet):

```sh
RUN_LIVE=1 \
  ARC_TEST_PRIVATE_KEY=0x... \
  ARC_PAYTO=0x<same-as-trust-api> \
  ARC_TRUST_API_URL=https://arc-trust-api.fly.dev \
  npm --workspace @arc/trust-api run smoke:paid-live
```

The script signs an EIP-3009 `transferWithAuthorization` for $0.01
USDC, POSTs it to `/v1/trust/read`, waits for the response, and
prints the decoded `X-Payment-Response` including the on-chain
`transaction` hash.

Append a row to
[`apps/trust-api/docs/known-live-runs.md`](../apps/trust-api/docs/known-live-runs.md)
with date, network, payer, pay-to, amount, tx hash, trust-api commit
SHA. **This is the W4 acceptance gate** — the moment ARC has real
money moving on Base mainnet for a real trust read.

## Step 7 — Submit the Bazaar listing

[`docs/bazaar-listing.md`](./bazaar-listing.md) is the source-of-truth
payload. After Steps 3 + 4 land, fill in the two placeholder URLs at
the top of the listing's "Status" table, then submit through the
current Bazaar onboarding flow (form / PR / API — check the live spec
at submission time).

The listing covers:
- `POST /v1/trust/read` ($0.01, live)
- `POST /v1/trust/read/deep` ($0.05, live with stub fallback)
- `GET /v1/passport/:address` (free)
- `GET /v1/attestations/:subject` (free)
- MCP integration via the deployed `@arc/mcp-server` URL

---

## Step 8 — Capture the demo flow

The closing artifact for Phase A is a single recorded interaction
that proves the system. From inside Claude Code / Codex / Cursor with
the ARC MCP server configured:

```jsonc
// IDE MCP config
{
  "mcpServers": {
    "arc": {
      "url": "https://arc-mcp-server.fly.dev/mcp"
    }
  }
}
```

Then in chat:

> Before I send 0.5 USDC to 0xabc…123, can you check the trust score?

The agent should:

1. Call `arc_trust_read({ target: "0xabc...123" })`.
2. Receive a 402, the MCP server signs (signing-payer mode), retries.
3. The trust-api verifies, runs scoreV1, settles $0.01 on Base.
4. The agent gets back the assessment + passport + attestations.
5. The agent surfaces the verdict and the user decides.

Save the transcript. That's V1.

---

## When you've completed Phase A you can truthfully say

> ARC is a live MCP-accessible trust layer with paid trust reads on
> Base mainnet USDC, ERC-8004-aligned identity primitives anchored on
> Arc testnet, and MENA-focused attestation schemas with counsel
> review pending.

That statement matters more than any further engineering. After
Phase A, **stop expanding scope**. The next leverage is users,
counterparties, design partners, and counsel — not code.

---

## Cross-references

- [`STRATEGIC_PIVOT.md`](../STRATEGIC_PIVOT.md) — pivot rationale +
  shipped-to-date matrix
- [`contracts/docs/PASSPORT.md`](../contracts/docs/PASSPORT.md) —
  Passport runbook + known deployments table
- [`contracts/docs/ADAPTER_SWAP_RUNBOOK.md`](../contracts/docs/ADAPTER_SWAP_RUNBOOK.md) —
  operational procedure for hot-swapping the identity adapter
- [`apps/trust-api/DEPLOY.md`](../apps/trust-api/DEPLOY.md) — trust-api
  deploy details, rollback, smoke recipe
- [`apps/mcp-server/DEPLOY.md`](../apps/mcp-server/DEPLOY.md) —
  mcp-server deploy details
- [`apps/trust-api/docs/known-live-runs.md`](../apps/trust-api/docs/known-live-runs.md) —
  live tx ledger (the W4 gate)
- [`apps/trust-api/docs/security-review-w12.md`](../apps/trust-api/docs/security-review-w12.md) —
  13-finding self-review (0 OPEN); operator should still engage a
  third-party audit before institutional-volume traffic
