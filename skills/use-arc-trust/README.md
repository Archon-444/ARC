# `use-arc-trust` — install guide

A Claude Skill that gates paid or destructive on-chain actions through
`arc_trust_read`, exposed by the `@arc/mcp-server` MCP server.

The skill itself is in [`SKILL.md`](./SKILL.md). This file is install +
configuration only.

> **Skill format:** SKILL.md uses the standard Claude Code skill
> frontmatter (`name`, `description`). Skill installer conventions
> evolve — always cross-reference the current Anthropic docs at
> https://docs.claude.com/ before bundling for distribution. This
> README intentionally avoids hardcoding any installer command that
> might rot.

---

## Step 1 — Install the MCP server

The skill depends on three MCP tools (`arc_trust_read`,
`arc_passport_get`, `arc_search`) provided by `@arc/mcp-server`. You
have two options.

### Option A: hosted (recommended)

Point your MCP client at a hosted instance. The reference deployment
URL is published in [`apps/mcp-server/README.md`](../../apps/mcp-server/README.md)
once available; the listing and listing payload live in
[`docs/bazaar-listing.md`](../../docs/bazaar-listing.md).

Claude Code config snippet (`.claude/mcp.json` or your IDE's MCP
settings):

```jsonc
{
  "mcpServers": {
    "arc": {
      "url": "https://<deployed-host>/mcp"
    }
  }
}
```

### Option B: stdio (local development)

Run the server locally against your own `@arc/trust-api` instance:

```bash
git clone <repo>
npm install
npm run build:x402-client
npm --workspace @arc/mcp-server run build

# point at a running trust-api
export ARC_TRUST_API_URL=https://trust.arc.example.com
node apps/mcp-server/dist/index.js   # MCP_TRANSPORT defaults to stdio
```

Claude Code config snippet:

```jsonc
{
  "mcpServers": {
    "arc": {
      "command": "node",
      "args": ["/abs/path/to/apps/mcp-server/dist/index.js"],
      "env": {
        "ARC_TRUST_API_URL": "https://trust.arc.example.com"
      }
    }
  }
}
```

## Step 2 — Install the skill

Copy `SKILL.md` (and ideally this folder) into your project's skills
directory. The exact path depends on your client; consult the current
Claude Code or Anthropic docs for the canonical location. The skill
file is portable across clients that support Claude Skill markdown
frontmatter.

Verify the skill is loaded by asking the model:

> "What does the use-arc-trust skill do?"

The model should describe the trust-read gate (call `arc_trust_read`,
threshold on composite, refuse below 60 without confirmation). If the
model does not know the skill, the file is not in a directory the
client scans.

## Operator note — funding the MCP server

`arc_trust_read` is a paid tool ($0.01 USDC per call on Base mainnet,
settled via x402). The MCP server has two postures:

| Posture | Behavior | Trigger |
|---|---|---|
| **stub-quote** (default) | Returns the 402 quote to the agent. The skill detects this and asks the user how to proceed. | `ARC_MCP_PAYER_PRIVATE_KEY` unset. |
| **signing-payer** | Server signs an EIP-3009 USDC authorization on behalf of the agent and retries. The agent receives the actual scored assessment. | `ARC_MCP_PAYER_PRIVATE_KEY` set to a 0x-prefixed 32-byte hex private key. |

The signing-payer wallet is funded by the **operator** of the MCP
server, not by ARC. Recommended posture for a hosted production
deployment is signing-payer with a wallet topped up to a known
ceiling (e.g. $10) and rotated regularly.

**Security:** the private key is held in process memory only and
never logged. It is read from `ARC_MCP_PAYER_PRIVATE_KEY` once at
startup. Use your platform's secret management (Fly secrets, Render
env vars, etc.) — do not commit the key.

## What this skill is NOT

- A KYB or AML system. The composite score is a heuristic plus
  (eventually) editorial commentary. Institutional transfers should
  layer counsel review and sanctions screening on top.
- A passport lookup tool. Use `arc_passport_get` (a separate, free
  tool exposed by the same MCP server) for that.
- A general-purpose risk model. The thresholds in `SKILL.md` are
  defaults; tune them for your domain.
