# Deploying `@arc/trust-api`

`apps/trust-api` is the Express + facilitator-backed x402 paywall.
This doc covers a Fly deployment; the same `Dockerfile` works on any
container host (Render, Railway, Cloud Run).

## Prereqs

- Fly CLI installed and authenticated (`fly auth login`)
- Repo cloned locally; **commands below run from the repo root**

## One-time setup

```sh
# Create the Fly app (skip if already created)
fly apps create arc-trust-api --org personal

# Required: Base mainnet USDC recipient for x402 settlement
fly secrets set ARC_PAYTO=0x... --app arc-trust-api
```

Optional secrets — set whichever the deployment needs:

```sh
# Flip reads to real on-chain state (after running deploy-passport.js
# and deploy-trust-suite.js — see contracts/docs/PASSPORT.md and
# /docs/PHASE_A_RUNBOOK.md):
fly secrets set ARC_RPC_URL=https://rpc.testnet.arc.network --app arc-trust-api
fly secrets set ARC_PASSPORT_ADDRESS=0x... --app arc-trust-api
fly secrets set ARC_ATTESTATION_REGISTRY_ADDRESS=0x... --app arc-trust-api

# Flip the deep tier from stub to live Haiku 4.5:
fly secrets set ARC_ANTHROPIC_API_KEY=sk-ant-... --app arc-trust-api
```

## Deploy

```sh
fly deploy --config apps/trust-api/fly.toml --dockerfile apps/trust-api/Dockerfile
```

The Dockerfile is multi-stage: build stage installs the full npm
workspace and compiles the five workspaces trust-api depends on
(`@arc/trust-core`, `@arc/x402-client`, `@arc/passport-sdk`,
`@arc/attestation-reader`, plus trust-api itself); runtime stage
copies only the `dist/` outputs and pruned `node_modules`. Final
image is small.

## Post-deploy smoke

```sh
# Health
curl https://arc-trust-api.fly.dev/v1/health

# 402 quote shape (no payment header → 402)
curl -i -X POST https://arc-trust-api.fly.dev/v1/trust/read \
  -H 'content-type: application/json' \
  -d '{"target":"0x0000000000000000000000000000000000000001"}'

# Passport route (200 placeholder or 503 unconfigured, depending on env)
curl https://arc-trust-api.fly.dev/v1/passport/0x0000000000000000000000000000000000000001
```

## Live $0.01 tx

Once deployed and `ARC_PAYTO` is funded-capable, capture the first
real settlement following the recipe in
[`docs/known-live-runs.md`](./docs/known-live-runs.md). Append a row
with the tx hash; that closes the W4 acceptance gate.

## Operational checklist after first deploy

- [ ] `/v1/health` returns `200 { status: "healthy" }`
- [ ] `/v1/trust/read` without payment returns `402` with a valid
      `accepts[]` quote pointing at the configured `ARC_PAYTO`
- [ ] `/v1/passport/:address` returns either a placeholder body or
      real on-chain state (depending on env)
- [ ] `/v1/attestations/:subject` returns either `503` (unconfigured)
      or a real list
- [ ] A row in `docs/known-live-runs.md` carries the first real tx hash
- [ ] The hosted URL is published in `docs/bazaar-listing.md` ahead of
      the Bazaar submission

## Rollback

```sh
fly releases list --app arc-trust-api
fly releases rollback <version> --app arc-trust-api
```
