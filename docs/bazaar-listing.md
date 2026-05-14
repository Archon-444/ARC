# Coinbase x402 Bazaar — listing payload

This file is the source of truth for the ARC trust layer's Bazaar
submission. Bazaar indexes paid HTTP endpoints (the ones that return
402 quotes), so the listing **targets `@arc/trust-api`'s public
surface**. `@arc/mcp-server` is documented as the recommended MCP
client for that surface — operators who prefer raw HTTP can call
trust-api directly, operators who want their agent to talk MCP point
the agent at the deployed mcp-server URL.

## Status

| Item | Status |
|---|---|
| Trust-api hosted URL | _(pending; see `apps/trust-api/docs/known-live-runs.md`)_ |
| MCP-server hosted URL | _(pending Fly deploy; see `apps/mcp-server/DEPLOY.md`)_ |
| Bazaar submission | _(pending: payload below; user-fired)_ |
| First settled live tx | _(pending: see `apps/trust-api/docs/known-live-runs.md`)_ |

Submission is user-fired because:
1. Bazaar's submission flow is external (form / PR / API depending on
   current Bazaar onboarding) and the exact path can change between
   weeks. Track the live spec at the time of submission.
2. The listing requires real hosted URLs, which are an operator-side
   concern (DNS, Fly app name, key funding).

## Listing payload

Submit a payload with at least these fields. Field names mirror what
Bazaar has historically expected; adjust to current schema before
filing.

### Service

```yaml
name: ARC Trust Read
slug: arc-trust-read
publisher: ARC
publisher_url: https://github.com/archon-444/arc
description: |
  Independent, editorial trust scoring for EVM addresses. ARC v1
  combines four heuristics (creator, contract, trading, liquidity)
  into a 0–100 composite score. Distinct from objective facilitator
  ranking: this is the editorial layer agents call before transacting
  with an unfamiliar address. MENA institutional posture (DFSA crypto
  token framework + ADGM FRT regime); attestation schemas land in
  later weeks.
contact: <ops-email>
license: MIT (server code) — pricing applies to API calls
```

### Endpoints

```yaml
endpoints:
  - method: POST
    path: /v1/trust/read
    price_usd: 0.01
    network: base-mainnet
    asset: USDC
    description: |
      v1 heuristic trust read for an EVM address. Returns scoreV1
      (composite + 4 factors), passport placeholder, attestation
      placeholder. Settled via x402 facilitator on Base mainnet.
    request_body_schema:
      type: object
      required: [target]
      properties:
        target:
          type: string
          pattern: "^0x[a-fA-F0-9]{40}$"
    response_402_example: |
      {
        "x402Version": 1,
        "error": "X-PAYMENT header is required",
        "accepts": [{
          "scheme": "exact",
          "network": "base-mainnet",
          "maxAmountRequired": "10000",
          "resource": "/v1/trust/read",
          "description": "ARC trust read — $0.01 per call",
          "payTo": "0x...<from operator config>",
          "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          "maxTimeoutSeconds": 60,
          "extra": { "name": "USD Coin", "version": "2" }
        }]
      }

  - method: POST
    path: /v1/trust/read/deep
    price_usd: 0.05
    network: base-mainnet
    asset: USDC
    status: live
    description: |
      Editorial commentary tier. Live since W10: settles $0.05 and
      returns Haiku 4.5 commentary (5KB prompt cache + structured
      JSON output) plus the v1 scoreV1 + free passport context. Falls
      back to deterministic stub commentary when ARC_ANTHROPIC_API_KEY
      is unset; in that case the response carries `source: "stub"`
      with no `degraded` marker. When the editorial path is attempted
      and fails (Anthropic outage, schema reject), the response
      surfaces `degraded: true` + `degradedReason: "editorial_generation_failed"`
      and the W14.6 middleware skips settlement on 4xx/5xx so a
      malformed request is never billed.

  # Free read endpoints (not paid; complement the paid routes by
  # giving the agent the on-chain context for the address it just
  # scored).
  - method: GET
    path: /v1/passport/:address
    price_usd: 0
    description: |
      ArcPassport record for an address. Returns real on-chain state
      when ARC_PASSPORT_ADDRESS + ARC_RPC_URL are set on the host;
      placeholder body otherwise. Free; no payment header required.

  - method: GET
    path: /v1/attestations/:subject?schema=<canonical-name>
    price_usd: 0
    description: |
      Attestation rows anchored against AttestationRegistry, optionally
      filtered by canonical schema name (counsel.kyb.v1, editorial.review.v1,
      treasury.policy.v1, token.suitability.v1, stablecoin.reserves.v1).
      503 if the host is unconfigured; 400 on unknown schema names.
      Free; no payment header required.
```

### MCP integration (recommended)

```yaml
mcp:
  recommended_client: "@arc/mcp-server"
  hosted_url: "https://<arc-mcp-host>/mcp"   # set after Fly deploy
  source: https://github.com/archon-444/arc/tree/main/apps/mcp-server
  tools_exposed:
    - arc_trust_read     # paid; proxies POST /v1/trust/read
    - arc_passport_get   # free; proxies GET /v1/passport/:address
    - arc_search         # free; placeholder until W11
  skill_bundle: https://github.com/archon-444/arc/tree/main/skills/use-arc-trust
  notes: |
    The MCP server can run in two postures:
      - stub-quote: server has no wallet; arc_trust_read returns the
        402 quote to the agent.
      - signing-payer: ARC_MCP_PAYER_PRIVATE_KEY funds a server-side
        wallet that signs $0.01 USDC payments transparently; agents
        get the assessment back directly.
    The stub-quote posture is fine for Bazaar discovery (the crawler
    sees a real 402 with a real quote). The signing-payer posture is
    what makes a "click and run" demo from inside Claude Code work.
```

### Discovery hints

```yaml
tags:
  - trust
  - editorial
  - mena
  - dfsa
  - adgm
  - usdu
  - arc
  - circle
  - x402
  - mcp
related_specs:
  - x402: https://github.com/coinbase/x402
  - mcp:  https://modelcontextprotocol.io/
  - erc-8004 (DRAFT): https://eips.ethereum.org/EIPS/eip-8004  # adapter-aligned, not compliant
```

## Submission checklist

Before filing:

- [ ] Trust-api is deployed and `https://<host>/v1/health` returns 200.
- [ ] Trust-api `/v1/trust/read` returns a real 402 quote whose `payTo`
      matches the funded operator wallet.
- [ ] At least one live tx is recorded in
      `apps/trust-api/docs/known-live-runs.md` proving end-to-end
      settlement works.
- [ ] MCP server is deployed and `https://<host>/health` returns 200,
      `https://<host>/mcp` is reachable by the MCP Inspector.
- [ ] `skills/use-arc-trust/SKILL.md` is updated with the deployed
      MCP URL in the example config.
- [ ] This file's "Status" table at the top is updated with hosted
      URLs.

After filing:

- [ ] Capture the submission acknowledgement (URL or ticket id) in the
      Status table above.
- [ ] On approval, paste the Bazaar listing URL into the top-level
      `README.md` under "Distribution surfaces."
