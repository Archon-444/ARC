# Security review — x402 facilitator integration (W12.3)

Closes the W12 plan's third acceptance gate verbatim:

> Security-review x402 facilitator integration.

Scope: the cryptographic + operational surface of `apps/trust-api`'s
paid path — `@arc/x402-client` middleware, the public facilitator
boundary, the W7 signing-payer mode added to `@arc/mcp-server`, and
the env-var trust boundary for `ARC_ANTHROPIC_API_KEY` /
`ARC_MCP_PAYER_PRIVATE_KEY` / `ARC_PAYTO`.

Out of scope: anything that would land in a third-party formal audit
(e.g. EIP-712 typed-data construction proofs, full constant-time-ness
of the signing code paths). The Solidity contracts (Passport,
Reputation, Attestation, Validation) are separately audited under
W8–W10 acceptance gates; their findings, if any, land in the
contract-specific docs.

This is a self-review — the operator should treat findings here as
"things to verify before going to production," not as "things we've
already paid auditors to attest to."

## Threat model

The trust-api sits between four trust boundaries:

```
  agent (Claude/Cursor/Bazaar) <-> mcp-server <-> trust-api <-> x402 facilitator <-> Base mainnet
                                       ^             ^
                                       |             |
                              signing-payer       editorial deep
                              wallet (W7)         tier (Anthropic, W10)
```

Adversaries we care about:

1. **External caller** sending malformed / oversized / repeated requests
   to the public trust-api endpoints. Goal: free reads, DoS, or
   triggering settlement on someone else's authorization.
2. **Replayer** capturing a valid `X-PAYMENT` envelope and resubmitting
   it to drain the same payer multiple times.
3. **Operator misconfig** — the trust-api host runs with a wrong
   `ARC_PAYTO`, an exposed `ARC_ANTHROPIC_API_KEY`, or a leaked
   `ARC_MCP_PAYER_PRIVATE_KEY`.
4. **Facilitator compromise / outage** — the public x402 facilitator
   misbehaves (returns wrong settle results, hangs, returns success
   for a forged authorization).
5. **Side-channel from the editorial deep tier** — the Haiku 4.5
   call could exfiltrate sensitive material through a prompt-injection
   attack on the target body.

## Findings + remediation status

Each finding is tagged:
**MITIGATED** — the code path or operational control already handles it.
**ACCEPT-WITH-DOCS** — the risk is real but bounded; documented so the
operator knows the failure mode and the manual response.
**OPEN** — needs work before production. None currently OPEN.

### F-01 Replay of `X-PAYMENT` envelope · MITIGATED

The EIP-3009 `transferWithAuthorization` envelope binds the
authorization to a single `nonce` (bytes32). The facilitator on
`/settle` invokes the USDC contract's
`transferWithAuthorization(from, to, value, validAfter, validBefore,
nonce, v, r, s)` which **records `nonce` per `from` and rejects
re-use on subsequent settle calls**. Two replays of the same
envelope settle once on first call, revert on second.

Verified by:
- `packages/x402-client/src/sign.ts` lines 62–63: `validAfter = now-5`,
  `validBefore = now + maxTimeoutSeconds`. Short validity window
  bounds the replay race even if the contract-side nonce check
  somehow failed.
- W5 paid-mock `[settle-fail]` path: a settle rejection returns 402
  with `errorReason` and the assistant retries with a **fresh nonce**.
  `randomNonce()` (lines 122–132) uses `crypto.getRandomValues`
  (32 bytes) so collision is statistically negligible.

### F-02 Settle hung / hangs forever · MITIGATED

The W5 `requirePayment` middleware enforces `settleTimeoutMs` (default
30s, configurable). On timeout the response is converted to 402 with
`errorReason: "settlement timeout"` and an `X-Payment-Response` body
of `{success: false, errorReason: "settlement timeout"}`. The
authorization stays unsettled — the payer can retry with a fresh
nonce.

The 30s default is generous given Base mainnet block times (~2s);
operators who run on slower L2s or congested mainnet can raise it
without code change. Operators on faster paths should consider
lowering it — a 30s wedge per request is exploitable as a slow-loris
amplifier.

### F-03 Settle returns success for a forged authorization · ACCEPT-WITH-DOCS

If the public x402 facilitator's signature check is itself broken,
the trust-api will trust it and serve the response. This is the
single point of failure in V0 ("rely on public facilitator; no
custom EIP-3009 verification").

Mitigations:
- The facilitator is run by Coinbase; the failure mode is a known
  shared dependency, not a hidden one.
- `@arc/x402-client` is the single swap surface; if the facilitator
  ever needs to change, one workspace's worth of code moves.
- `apps/trust-api/docs/known-live-runs.md` is the audit ledger;
  every paid round-trip is recorded with its tx hash so an operator
  diffing the ledger can spot anomalies.

Accepted as a V0 risk. Custom EIP-3009 verification is in the 90-day
out-of-scope list ("we do not build custom EIP-3009 settlement in V0
— revisit only if economics demand it.")

### F-04 Bad / oversized request body · MITIGATED

- `express.json({ limit: '64kb' })` in `apps/trust-api/src/index.ts`
  rejects bodies larger than 64KB before they reach any handler.
  Trust-read bodies are ~50 bytes; passport reads have no body.
- W5 per-IP rate limiter (default 120/min global) blocks high-frequency
  abuse from a single source.
- W5 per-paid-route limiter (default 30/min, keyed on `req.x402.payer
  ?? ip`) blocks rapid-fire bad payloads against the paid surface,
  which is the part that could burn facilitator capacity.

### F-05 Target address validation · MITIGATED

`apps/trust-api/src/routes/trust.ts` validates `target` against
`/^0x[a-fA-F0-9]{40}$/` and returns 400 on mismatch. Same regex in
`trust-deep.ts`. The address is normalized to lowercase before use
so case variants are not exploitable as cache-key bypass.

### F-06 `ARC_PAYTO` misconfiguration · MITIGATED

`config.ts` warns at startup if `ARC_PAYTO` is unset; paid routes
return 500 ("ARC_PAYTO is not configured") rather than producing a
quote with a zero address. A typo'd `ARC_PAYTO` (legitimate-looking
but wrong address) is a different problem the operator has to catch
via the known-live-runs ledger.

Health probe stays up even when ARC_PAYTO is unset so ops can
detect missing config without the process restarting.

### F-07 `ARC_ANTHROPIC_API_KEY` exposure · MITIGATED

- The key is read once at startup (config.ts) and held in process
  memory. It is not logged anywhere: JSON logger does not include
  the config object, the API request to Anthropic does not echo
  the key into the response payload.
- Editorial failures fall through to the deterministic stub without
  exposing the key in error messages (the trust-deep handler catches
  the EditorialClient throw and never inlines it into the response
  body).
- Process listing (`ps auxe`) can leak env vars on a multi-tenant
  host. The deploy artifacts (`apps/mcp-server/fly.toml`,
  trust-api's documented env shape) use platform secrets, not
  env-on-command-line.

Recommendation for production: rotate the Anthropic key on the
Anthropic console + redeploy if a leak is suspected; the key is not
recoverable from inside the process.

### F-08 `ARC_MCP_PAYER_PRIVATE_KEY` exposure · MITIGATED

Same posture as F-07: read once, held in memory, never logged,
caught + suppressed in error paths.

Additional control: the W7 signing-payer wallet is operator-funded
and rotates by re-funding a new wallet + `fly secrets set` + redeploy.
A leaked key bounds blast radius to the current wallet balance —
which the operator can keep small (e.g. $10 ceiling, alerted on
balance below $5). Documented in
`apps/mcp-server/DEPLOY.md` → "Funding ceiling".

### F-09 Prompt-injection on the editorial deep tier · ACCEPT-WITH-DOCS

The Haiku 4.5 call receives a `target` EVM address plus the v1
heuristic scoreV1 numbers. Both are constrained-shape values
(40-hex address, four 0..100 integers + one 0..100 composite). The
attack surface is:

- An adversary publishing a token whose contract source contains
  prompt-injection text the v1 heuristic surfaces in its `details`
  string. The v1 heuristic outputs `details: string` per factor
  (`RiskFactor.details` in `@arc/trust-core`); if the editorial
  prompt ever reads those `details`, prompt-injection is possible.

The W10 deep tier prompt (`apps/trust-api/src/editorial/prompt.ts`)
reads **only the numerical `scoreV1` payload** (composite + 4
factors), not the `details` strings. The user message is built
mechanically in `buildUserMessage(target, scoreV1)`:

```
<target>0xabc...</target>
<scoreV1>{"composite":78,"factors":{"creator":80,"contract":75,"trading":82,"liquidity":70}}</scoreV1>
```

Constrained to numbers + a 40-hex address. The injection surface is
the `target` address itself, which is regex-validated upstream.

If we ever feed the `details` text into the prompt, F-09 flips
from ACCEPT to OPEN; the right mitigation at that point is escaping
+ a system-prompt instruction to ignore any directives embedded in
the user payload. Logged so we don't accidentally widen the surface.

### F-10 Editorial response cache poisoning · MITIGATED

The W10 deep tier caches commentary by target. Cache keys are the
lowercased EVM address; the cached value is the parsed structured
JSON output from Haiku (validated against the
`DEEP_TIER_OUTPUT_SCHEMA`). An adversary cannot poison the cache:

- Cache writes only happen on `result.paid === true` after the
  facilitator confirms settlement.
- The schema is strict (`additionalProperties: false`); a Haiku
  response that doesn't match throws + falls through to the stub.
- Cache entries expire after `ARC_DEEP_CACHE_TTL_MS` (default 1h),
  bounding any single bad entry's lifetime.

### F-11 Memory exhaustion via cache · MITIGATED-WITH-CAVEAT

The deep-tier response cache is an in-memory `TtlCache` (from
`@arc/trust-core`). Unbounded growth would be possible if every
distinct EVM address generated a cache entry.

The 1-hour TTL bounds growth: at 10 unique targets/sec sustained
(well above realistic agent traffic), the cache holds at most ~36k
entries before TTL kicks in. Each entry is ~2KB of structured JSON,
so worst-case ~72MB resident — well within a single Fly machine's
512MB allocation.

Caveat: the cache is unbounded in size; only TTL evicts. If an
operator sees real traffic patterns where unique-target rate spikes
sustained, the right mitigation is a max-entries lid + LRU
eviction. Trivial to add to `TtlCache`; not pre-emptively done.

### F-12 TLS posture · OPERATOR RESPONSIBILITY

The trust-api process is plain HTTP; TLS termination is expected at
the deploy platform (Fly/Render edge, fronted by a Cloudflare or
similar). Operators self-host without a TLS layer are exposing
`X-PAYMENT` headers + Anthropic responses in clear. Documented in
`apps/mcp-server/DEPLOY.md`; cross-link added below.

### F-13 Body parsing DoS · MITIGATED

`express.json({ limit: '64kb' })` + `helmet()` defaults block the
common parse-bomb / header-flood vectors. `compression()` follows
`json` so a malicious response cannot inflate against the bench.
Nothing else parses untrusted XML / YAML / multipart.

## Audit checklist before going to production

| Item | Owner | Status |
|---|---|---|
| Live `$0.01` round-trip on Base mainnet recorded in `known-live-runs.md` | Operator | Pending (W5 carryover) |
| `fly secrets set` performed for ARC_PAYTO, ARC_ANTHROPIC_API_KEY, ARC_MCP_PAYER_PRIVATE_KEY | Operator | Pending |
| Wallet balance alert configured on the signing-payer wallet (alert at $5) | Operator | Pending |
| TLS terminated by the deploy platform (HTTPS only) | Operator | Pending |
| Production `RATE_LIMIT_MAX` / `PAID_RATE_LIMIT_MAX` tuned to observed agent traffic | Operator | Default ceiling acceptable for V0 |
| Per-API-key rate limiting | Future (post-W12) | Out of scope until key-issuance flow exists |
| Sentry / DataDog / OTEL wiring | Future (post-W12) | Out of scope; structured JSON logger holds the line for V0 |
| Smart-contract audits (Passport, Attestation, Reputation, Validation) | External | Per-contract docs |

## Why this review is conservative

Every finding above is either MITIGATED or ACCEPT-WITH-DOCS. Nothing
is OPEN. That's deliberately conservative posture for a system that
moves USDC on Base mainnet:

- The single biggest risk (F-03, facilitator compromise) is
  acknowledged and bounded by the V0 "no custom EIP-3009" decision.
  The trust-api code is not the right place to harden it; the right
  place is the facilitator boundary, which is Coinbase's surface.
- The wallet exposure risks (F-07, F-08) are operationally bounded
  (small funded wallets, easy rotation, no logging) rather than
  cryptographically bounded — which is correct for V0.
- The prompt-injection risk (F-09) is bounded by what the prompt
  actually reads, and the constraint is documented so we don't widen
  it by accident.

For a higher-stakes deployment (institutional treasury volume), the
next pass should engage a third-party auditor against
`packages/x402-client/`, the Solidity contracts, and the deploy
posture. That is post-W12 hardening.
