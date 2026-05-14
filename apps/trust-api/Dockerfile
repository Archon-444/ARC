# syntax=docker/dockerfile:1.7
#
# @arc/trust-api — Express + facilitator-backed x402 paywall on Base
# mainnet USDC. Same multi-stage shape as apps/mcp-server/Dockerfile;
# pulls the workspace so workspace deps (@arc/trust-core,
# @arc/x402-client, @arc/passport-sdk, @arc/attestation-reader) resolve.
#
# Build from the repo root:
#   docker build -f apps/trust-api/Dockerfile -t arc-trust-api .

FROM node:22-alpine AS build
WORKDIR /repo

# Workspace manifests for the dep graph.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/trust-core/package.json packages/trust-core/
COPY packages/x402-client/package.json packages/x402-client/
COPY packages/passport-sdk/package.json packages/passport-sdk/
COPY packages/attestation-reader/package.json packages/attestation-reader/
COPY apps/trust-api/package.json apps/trust-api/

RUN npm ci --workspaces --include-workspace-root

# Source — only the workspaces trust-api needs.
COPY packages/trust-core packages/trust-core
COPY packages/x402-client packages/x402-client
COPY packages/passport-sdk packages/passport-sdk
COPY packages/attestation-reader packages/attestation-reader
COPY apps/trust-api apps/trust-api

# x402-client must build first — trust-api consumes its CJS dist.
RUN npm --workspace @arc/x402-client run build \
 && npm --workspace @arc/passport-sdk run build \
 && npm --workspace @arc/attestation-reader run build \
 && npm --workspace @arc/trust-api run build

RUN npm prune --omit=dev --workspace @arc/trust-api


FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3030 \
    HOST=0.0.0.0

COPY --from=build /repo/package.json /repo/package-lock.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/trust-core/package.json ./packages/trust-core/
COPY --from=build /repo/packages/trust-core/dist ./packages/trust-core/dist
COPY --from=build /repo/packages/x402-client/package.json ./packages/x402-client/
COPY --from=build /repo/packages/x402-client/dist ./packages/x402-client/dist
COPY --from=build /repo/packages/passport-sdk/package.json ./packages/passport-sdk/
COPY --from=build /repo/packages/passport-sdk/dist ./packages/passport-sdk/dist
COPY --from=build /repo/packages/attestation-reader/package.json ./packages/attestation-reader/
COPY --from=build /repo/packages/attestation-reader/dist ./packages/attestation-reader/dist
COPY --from=build /repo/apps/trust-api/package.json ./apps/trust-api/
COPY --from=build /repo/apps/trust-api/dist ./apps/trust-api/dist

EXPOSE 3030

# Required runtime env (set via deploy platform secrets):
#   ARC_PAYTO                          — Base mainnet recipient for x402 USDC
# Optional:
#   ARC_PASSPORT_ADDRESS               — flips /v1/passport/:address to real on-chain reads
#   ARC_ATTESTATION_REGISTRY_ADDRESS   — flips /v1/attestations/:subject to real on-chain reads
#   ARC_RPC_URL                        — Arc testnet RPC (default in code)
#   ARC_ANTHROPIC_API_KEY              — flips deep tier from stub to live Haiku 4.5
CMD ["node", "apps/trust-api/dist/index.js"]
