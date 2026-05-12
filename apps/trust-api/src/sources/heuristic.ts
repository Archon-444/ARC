/**
 * V0 data source for the trust read.
 *
 * The frontend risk route reads from the legacy subgraph (LaunchedToken,
 * TokenTrade, creator withdrawals). That graph is going to move into
 * `legacy-primitives/` in W11 and is not the data source the trust-api
 * should depend on long term. For W3 we ship a deterministic stub so the
 * paywall + facilitator integration can be smoke-tested end-to-end. The
 * real source plugs in at W8 when ArcPassport + AttestationRegistry land.
 */

import {
  computeRiskAssessment,
  scoreToLevel,
  type TokenRiskAssessment,
} from '@arc/trust-core';

export function v0HeuristicAssessment(target: string): TokenRiskAssessment {
  // Deterministic mock: derive a stable creator history + trade pattern
  // from the target address so two calls for the same address produce
  // the same score (caller-facing reproducibility for the demo).
  const seed = hashSeed(target.toLowerCase());
  const token = {
    totalSupply: '1000000000000000000000000',
    soldSupply: bigIntFromSeed(seed, 'sold'),
    isGraduated: false,
    createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 12),
    creator: '0x' + seed.padStart(40, '0').slice(0, 40),
    graduation: null,
  };
  const creatorTokens = Array.from({ length: 1 + (parseInt(seed.slice(0, 2), 16) % 3) }, (_, i) => ({
    isGraduated: i === 0,
    createdAt: String(Math.floor(Date.now() / 1000) - 86400 * (60 + i * 10)),
  }));
  const trades = mockTrades(seed);
  const assessment = computeRiskAssessment(token, creatorTokens, trades, []);
  // Add a marker so consumers can see this is v0 stub data.
  return {
    ...assessment,
    scoringVersion: `${assessment.scoringVersion ?? 'v1.0.0'}-stub`,
    disclaimer:
      'V0 stub data. ARC trust-api is wired against the v1 heuristic engine and ' +
      'the live x402 facilitator on Base mainnet. The data source plugs into ' +
      'ArcPassport + AttestationRegistry in W8-W10.',
  };
}

export { scoreToLevel };

function hashSeed(s: string): string {
  let h = 0xcafebabe;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0) ^ ((h << 13) | (h >>> 19));
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function bigIntFromSeed(seed: string, kind: string): string {
  const offset = kind.length;
  const pct = (parseInt(seed.slice(0, 2), 16) + offset) % 100;
  const supply = 1_000_000n;
  const portion = (supply * BigInt(pct)) / 100n;
  return (portion * 10n ** 18n).toString();
}

function mockTrades(seed: string): { buyTrades: any[]; sellTrades: any[] } {
  const buys = parseInt(seed.slice(0, 1), 16) + 5;
  const sells = Math.max(0, parseInt(seed.slice(1, 2), 16) - 2);
  return {
    buyTrades: Array.from({ length: buys }, (_, i) => ({
      trader: `0x${(i + 1).toString(16).padStart(40, '0')}`,
      usdcAmount: '1000000',
    })),
    sellTrades: Array.from({ length: sells }, (_, i) => ({
      trader: `0x${(i + buys + 1).toString(16).padStart(40, '0')}`,
      usdcAmount: '1000000',
    })),
  };
}
