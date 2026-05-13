# `MILESTONE/test-outputs/`

Captured stdout+stderr for the W5–W7 consolidation gate. Generated on
2026-05-13 against branch `claude/trust-layer-agents-sNcay` at HEAD =
`64f3dfe` (the docs-refresh commit that closes W7 in tree).

The log files are the durable evidence behind [`../../MILESTONE_W5_W7.md`](../../MILESTONE_W5_W7.md);
do not edit them by hand. To regenerate, run the block below from the
repo root. The session-start hook has already done `npm install`; the
block assumes a clean working tree.

```bash
mkdir -p MILESTONE/test-outputs

npm run type-check:trust-core   > MILESTONE/test-outputs/01-type-check-trust-core.txt   2>&1
npm run type-check:x402-client  > MILESTONE/test-outputs/02-type-check-x402-client.txt  2>&1
npm run type-check:trust-api    > MILESTONE/test-outputs/03-type-check-trust-api.txt    2>&1
npm run type-check:mcp-server   > MILESTONE/test-outputs/04-type-check-mcp-server.txt   2>&1

npm --workspace @arc/trust-core test  > MILESTONE/test-outputs/05-test-trust-core.txt           2>&1
npm run smoke:trust-api               > MILESTONE/test-outputs/06-smoke-trust-api.txt           2>&1
npm run smoke:trust-api:paid-mock     > MILESTONE/test-outputs/07-smoke-trust-api-paid-mock.txt 2>&1

# x402-client dist must exist before mcp-server's compiled dist can load it.
npm run build:x402-client                 >> MILESTONE/test-outputs/02-type-check-x402-client.txt  2>&1
npm --workspace @arc/mcp-server run build >> MILESTONE/test-outputs/04-type-check-mcp-server.txt   2>&1
npm run test:mcp-server                   >  MILESTONE/test-outputs/08-test-mcp-server.txt        2>&1
```

## Sentinels

Each log file should contain its expected sentinel; if a re-run produces
a log missing the sentinel, the milestone gate fails and the underlying
issue must be fixed in a separate prior commit.

| File | Sentinel |
|---|---|
| `01-type-check-trust-core.txt` | exits 0; no `error TS` line |
| `02-type-check-x402-client.txt` | exits 0; no `error TS`; build step appended at bottom |
| `03-type-check-trust-api.txt` | exits 0; no `error TS` |
| `04-type-check-mcp-server.txt` | exits 0; no `error TS`; build step appended at bottom |
| `05-test-trust-core.txt` | `Tests:       33 passed, 33 total` |
| `06-smoke-trust-api.txt` | `smoke OK` |
| `07-smoke-trust-api-paid-mock.txt` | `paid-mock OK` (plus the four sub-markers: paid, settle-fail, deep-quote, deep-501) |
| `08-test-mcp-server.txt` | three end-of-spec lines: `inspector OK`, `inspector-http OK`, `inspector-paid OK` |
