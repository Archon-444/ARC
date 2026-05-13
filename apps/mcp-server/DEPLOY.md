# Deploying `@arc/mcp-server`

This guide covers Fly.io because the included `fly.toml` is tuned for
it. The `Dockerfile` is platform-agnostic — the same image runs on
Render, Railway, AWS Fargate, Google Cloud Run, etc., with appropriate
secrets wiring.

## Prerequisites

- A running `@arc/trust-api` instance (HTTPS recommended). Note its base
  URL; you'll set it as `ARC_TRUST_API_URL`.
- Optional: a Base mainnet wallet for signing-payer mode. The wallet
  must hold USDC + a small amount of ETH for gas if your facilitator
  expects the payer to cover gas (most do not — verify against your
  trust-api facilitator config). $10 USDC bankrolls 1000 paid calls.
- Optional: a long random string for `MCP_HTTP_AUTH_TOKEN` if you want
  the endpoint behind bearer auth. Off by default so MCP Inspector and
  the Coinbase x402 Bazaar crawler can probe anonymously.

## Fly.io — first deploy

```bash
# from repo root
fly auth login
fly apps create arc-mcp-server   # or update fly.toml `app =` first

# secrets (only ARC_TRUST_API_URL is required)
fly secrets set --app arc-mcp-server \
  ARC_TRUST_API_URL=https://trust.arc.example.com

# optional: signing-payer mode
fly secrets set --app arc-mcp-server \
  ARC_MCP_PAYER_PRIVATE_KEY=0x...

# optional: bearer auth on /mcp
fly secrets set --app arc-mcp-server \
  MCP_HTTP_AUTH_TOKEN=$(openssl rand -hex 32)

# deploy
fly deploy --config apps/mcp-server/fly.toml \
           --dockerfile apps/mcp-server/Dockerfile
```

## Post-deploy smoke

```bash
# 1. Health check
curl https://arc-mcp-server.fly.dev/health
# -> {"status":"ok","service":"@arc/mcp-server","transport":"http"}

# 2. MCP Inspector (manual)
npx @modelcontextprotocol/inspector https://arc-mcp-server.fly.dev/mcp
# Should list arc_trust_read, arc_passport_get, arc_search.
# Calling arc_passport_get against any 0x address should return
# the trust-api passport placeholder.
# Calling arc_trust_read returns either a paid assessment (if
# ARC_MCP_PAYER_PRIVATE_KEY is configured) or a payment_required
# quote.

# 3. Programmatic check from a Claude Code / Cursor / Codex MCP client
# Configure the MCP client per skills/use-arc-trust/README.md and ask
# the model: "What does arc_trust_read return for 0x...?"
```

## Operating notes

- **Stateful sessions:** the Streamable HTTP transport keeps per-session
  state in machine memory (one transport per `Mcp-Session-Id`). Do not
  enable `auto_stop_machines` — stopping a machine drops all open
  sessions. Scale horizontally only when needed; sessions do not load-
  balance across machines without a sticky-session router.
- **Funding ceiling:** if running signing-payer mode, set an alert on
  the wallet balance. The server does not enforce per-call ceilings;
  trust-api's rate limiter is the second line of defence
  (`RATE_LIMIT_*` env vars on the trust-api side).
- **Key rotation:** rotate `ARC_MCP_PAYER_PRIVATE_KEY` by funding a
  new wallet, `fly secrets set` the new key, redeploy. The old wallet
  becomes inactive on the next machine restart.
- **Logs:** `fly logs --app arc-mcp-server` streams the structured
  log lines from the server. The boot line prints transport + payer
  posture so operators can verify configuration at a glance.

## Updating the listing

After the first stable deploy, paste the deployed URL into
`docs/bazaar-listing.md` (under "endpoints") and submit per the
listing instructions there.
