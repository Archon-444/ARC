#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install frontend dependencies (primary workspace)
cd "$CLAUDE_PROJECT_DIR/frontend"
npm install --prefer-offline --no-audit 2>/dev/null
