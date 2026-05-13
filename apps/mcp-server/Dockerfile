# syntax=docker/dockerfile:1.7
#
# @arc/mcp-server — Streamable HTTP MCP server.
#
# Multi-stage build keeps the runtime image small. The build stage
# pulls the whole npm workspace (so workspace deps like @arc/x402-client
# resolve), compiles the workspace package by package, and the runtime
# stage copies only the dist outputs + production node_modules.
#
# Default transport is HTTP on 0.0.0.0:8080. Override at run time with
# `-e MCP_TRANSPORT=stdio` if you ever want to use this image as a stdio
# binary (unusual for a container).

FROM node:22-alpine AS build
WORKDIR /repo

# Copy lockfile + workspace manifests first so dep install caches well.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/x402-client/package.json packages/x402-client/
COPY packages/trust-core/package.json packages/trust-core/
COPY apps/mcp-server/package.json apps/mcp-server/

RUN npm ci --workspaces --include-workspace-root

# Now bring in source and build the two workspaces we need.
COPY packages/x402-client packages/x402-client
COPY apps/mcp-server apps/mcp-server

RUN npm --workspace @arc/x402-client run build \
 && npm --workspace @arc/mcp-server run build

# Prune dev deps for the runtime stage.
RUN npm prune --omit=dev --workspace @arc/mcp-server


FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    PORT=8080 \
    HOST=0.0.0.0

# Bring in the workspace tree (mcp-server's compiled dist + the runtime
# node_modules + the built x402-client dist).
COPY --from=build /repo/package.json /repo/package-lock.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/x402-client/package.json ./packages/x402-client/
COPY --from=build /repo/packages/x402-client/dist ./packages/x402-client/dist
COPY --from=build /repo/apps/mcp-server/package.json ./apps/mcp-server/
COPY --from=build /repo/apps/mcp-server/dist ./apps/mcp-server/dist

EXPOSE 8080

# ARC_TRUST_API_URL is required at runtime; surfaced by the deploy
# platform's secret manager (Fly secrets, Render env, ...).
CMD ["node", "apps/mcp-server/dist/index.js"]
