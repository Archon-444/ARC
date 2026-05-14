/**
 * W12 load test. Boots createApp() in-process on an ephemeral port,
 * fires `autocannon` at 10rps for 30s against the three documented
 * routes, prints p50/p95/p99/p999 latency + req/sec achieved, and
 * exits non-zero if SLOs are breached.
 *
 * SLOs (W12 baseline; tune in W12.5 once production traffic shapes
 * are visible):
 *
 *   GET  /v1/health                  p95 <  50ms, no errors
 *   GET  /v1/passport/<addr>         p95 < 100ms, no errors
 *   POST /v1/trust/read (no payment) p95 < 200ms, every response is
 *                                    a 402 (the W5 paywall flow)
 *
 * Run:
 *   npm --workspace @arc/trust-api run smoke:load
 *
 * Env overrides:
 *   ARC_LOAD_DURATION  — seconds of load per route (default 30)
 *   ARC_LOAD_RATE      — req/sec per route (default 10)
 *   ARC_LOAD_OUT       — write the structured result JSON to this
 *                        path (default: stdout summary only)
 *
 * Why 10rps:
 *   - Matches the W12 plan acceptance gate verbatim.
 *   - Trust-api is read-mostly and the paid path is bottlenecked on
 *     facilitator round-trips, not local CPU. 10rps per route is
 *     comfortably within the per-IP rate-limit ceiling (120/min
 *     global, 60/min per-paid-route from W5.3) so the limiter does
 *     not fire and skew the latency numbers.
 *   - Above 10rps, the right place to load-test is at the facilitator
 *     boundary (with a stub or against testnet) — not the trust-api
 *     handler itself, which is microseconds of work per call.
 */

import autocannon, { type Result } from 'autocannon';
import { writeFileSync } from 'fs';

import { createApp } from '../src/index';
import { loadConfig } from '../src/config';

interface RouteSpec {
  label: string;
  method: 'GET' | 'POST';
  path: string;
  body?: string;
  headers?: Record<string, string>;
  expectStatus: number;
  /** Pass criteria for this route. */
  slo: {
    p95Ms: number;
    /** Maximum tolerated non-`expectStatus` responses (0 = no errors). */
    maxOffStatus: number;
  };
}

const DURATION_S = Number(process.env.ARC_LOAD_DURATION ?? 30);
const RATE_PER_ROUTE = Number(process.env.ARC_LOAD_RATE ?? 10);
const OUT_PATH = process.env.ARC_LOAD_OUT ?? null;

const ROUTES: RouteSpec[] = [
  {
    label: 'health',
    method: 'GET',
    path: '/v1/health',
    expectStatus: 200,
    slo: { p95Ms: 50, maxOffStatus: 0 },
  },
  {
    label: 'passport',
    method: 'GET',
    path: '/v1/passport/0x1234567890abcdef1234567890abcdef12345678',
    expectStatus: 200,
    slo: { p95Ms: 100, maxOffStatus: 0 },
  },
  {
    label: 'trust-read-quote',
    method: 'POST',
    path: '/v1/trust/read',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ target: '0x1234567890abcdef1234567890abcdef12345678' }),
    expectStatus: 402,
    // The 402 quote path runs the same middleware chain as a paid call,
    // minus the facilitator round-trip. 200ms p95 is generous to allow
    // for cold-start jitter in the first few seconds of load.
    slo: { p95Ms: 200, maxOffStatus: 0 },
  },
];

async function runRoute(baseUrl: string, route: RouteSpec): Promise<Result> {
  // overallRate is total-rps across all connections — what we actually
  // want for an SLO at N rps. connectionRate × connections would
  // multiply and miss the target.
  return await autocannon({
    url: `${baseUrl}${route.path}`,
    method: route.method,
    headers: route.headers,
    body: route.body,
    overallRate: RATE_PER_ROUTE,
    connections: 4,
    duration: DURATION_S,
    expectBody: undefined,
  } as Parameters<typeof autocannon>[0]);
}

function statusBreakdown(result: Result, expectStatus: number): Record<string, number> {
  const breakdown: Record<string, number> = {};
  const counters: Record<string, number> = {
    '1xx': result['1xx'] ?? 0,
    '2xx': result['2xx'] ?? 0,
    '3xx': result['3xx'] ?? 0,
    '4xx': result['4xx'] ?? 0,
    '5xx': result['5xx'] ?? 0,
    'non-2xx': result.non2xx ?? 0,
  };
  for (const [k, v] of Object.entries(counters)) {
    if (v > 0) breakdown[k] = v;
  }
  breakdown.expected_status = expectStatus;
  return breakdown;
}

function offStatusCount(result: Result, expectStatus: number): number {
  const total = result.requests.total ?? 0;
  // autocannon reports per-bucket counters; "matching" means a 2xx
  // when expected is 2xx, etc. For our 402-expected case, total -
  // (4xx) gives the wrong-status count.
  const expectedBucket = `${Math.floor(expectStatus / 100)}xx` as '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  const matched = result[expectedBucket] ?? 0;
  return Math.max(0, total - matched - (result.errors ?? 0));
}

async function main(): Promise<void> {
  // Raise the W5 rate-limiter ceiling well above the load-test rate so
  // we measure handler latency, not the limiter. The production limiter
  // still ships -- the test only configures its own bench server.
  // localhost hits a single IP, so any sustained rate above the per-IP
  // window/max would otherwise fire after a few seconds and skew p99.
  // The rate-limit middleware reads process.env directly, so we set
  // there rather than passing through loadConfig.
  process.env.RATE_LIMIT_WINDOW_MS = '1000';
  process.env.RATE_LIMIT_MAX = '10000';
  process.env.PAID_RATE_LIMIT_WINDOW_MS = '1000';
  process.env.PAID_RATE_LIMIT_MAX = '10000';

  const cfg = loadConfig({
    ...process.env,
    ARC_PAYTO: process.env.ARC_PAYTO || '0x' + '11'.repeat(20),
  });
  const app = createApp(cfg);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[smoke-load] target=${baseUrl} duration=${DURATION_S}s rate=${RATE_PER_ROUTE}rps`);

  interface RouteSummary {
    label: string;
    method: string;
    path: string;
    expectStatus: number;
    rps_observed: number;
    requests_total: number;
    latency_ms: { p50: number; p95: number; p99: number; p999: number; max: number };
    off_status_count: number;
    errors: number;
    status_breakdown: Record<string, number>;
    slo: { p95Ms: number; maxOffStatus: number };
    slo_ok: boolean;
  }

  const summaries: RouteSummary[] = [];

  try {
    for (const route of ROUTES) {
      console.log(`[smoke-load] ${route.method} ${route.path} ...`);
      const result = await runRoute(baseUrl, route);
      const off = offStatusCount(result, route.expectStatus);
      const sloOk =
        result.latency.p97_5 <= route.slo.p95Ms * 1.1 && // give p95 a little tolerance via p97_5
        result.latency.p99 <= route.slo.p95Ms * 1.5 &&
        off <= route.slo.maxOffStatus &&
        (result.errors ?? 0) === 0;

      const summary: RouteSummary = {
        label: route.label,
        method: route.method,
        path: route.path,
        expectStatus: route.expectStatus,
        rps_observed: result.requests.average,
        requests_total: result.requests.total,
        latency_ms: {
          p50: result.latency.p50,
          p95: result.latency.p97_5, // autocannon doesn't report p95; p97_5 is the closest
          p99: result.latency.p99,
          p999: result.latency.p99_9,
          max: result.latency.max,
        },
        off_status_count: off,
        errors: result.errors ?? 0,
        status_breakdown: statusBreakdown(result, route.expectStatus),
        slo: route.slo,
        slo_ok: sloOk,
      };
      summaries.push(summary);
      console.log(
        `  total=${summary.requests_total} ` +
          `rps=${summary.rps_observed.toFixed(1)} ` +
          `p50=${summary.latency_ms.p50}ms ` +
          `p95~=${summary.latency_ms.p95}ms ` +
          `p99=${summary.latency_ms.p99}ms ` +
          `off=${summary.off_status_count} errors=${summary.errors} ` +
          `slo=${summary.slo_ok ? 'OK' : 'FAIL'}`
      );
    }
  } finally {
    server.close();
  }

  const report = {
    capturedAt: new Date().toISOString(),
    durationSeconds: DURATION_S,
    targetRate: RATE_PER_ROUTE,
    routes: summaries,
    overall_slo_ok: summaries.every((s) => s.slo_ok),
  };

  if (OUT_PATH) {
    writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(`\n[smoke-load] wrote report to ${OUT_PATH}`);
  }

  if (!report.overall_slo_ok) {
    console.error('[smoke-load] FAIL: one or more routes breached their SLO.');
    process.exit(1);
  }
  console.log('[smoke-load] OK: all routes within SLO.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
