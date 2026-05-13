import type { DeepTierCommentary } from './prompt';

/**
 * Deterministic stub commentary used when ANTHROPIC_API_KEY is not
 * configured. Keeps the wire shape correct so paid-mock + production
 * settlement can both exercise the deep-tier route end-to-end without
 * a live Anthropic key.
 *
 * The verdict bands are intentionally conservative — when there is no
 * editorial layer behind the response, we should not pretend to one.
 * The summary makes the stub posture explicit so a downstream
 * consumer can render "no editorial commentary available" rather than
 * passing the stub off as a real verdict.
 */
export function stubCommentary(
  target: string,
  scoreV1: {
    composite: number;
    factors: { creator: number; contract: number; trading: number; liquidity: number };
  }
): DeepTierCommentary {
  const c = scoreV1.composite;

  let verdict: DeepTierCommentary['verdict'];
  if (c >= 80) verdict = 'low-risk';
  else if (c >= 60) verdict = 'moderate-risk';
  else if (c >= 30) verdict = 'elevated-risk';
  else verdict = 'do-not-engage';

  const factors = scoreV1.factors;
  const lowest = (['creator', 'contract', 'trading', 'liquidity'] as const).reduce(
    (acc, k) => (factors[k] < factors[acc] ? k : acc),
    'creator' as 'creator' | 'contract' | 'trading' | 'liquidity'
  );

  const topConcerns: string[] = [];
  if (factors[lowest] < 70) {
    topConcerns.push(
      `The ${lowest} factor (${factors[lowest]}/100) is the weakest of the four and would be the first place to look for downside risk.`
    );
  }
  if (c < 60) {
    topConcerns.push(
      'The composite score is below 60; treat this address as unvetted unless paired with a counsel.kyb.v1 attestation or a stronger editorial review.'
    );
  }

  return {
    verdict,
    summary:
      'Deterministic stub commentary — no editorial layer is active (set ARC_ANTHROPIC_API_KEY on the trust-api host to enable the live Haiku-backed deep tier).',
    reasoning: `Stub mapping from the v1 heuristic composite of ${c}/100 to a conservative verdict band, with the weakest factor surfaced as the headline concern. The real deep tier produces calibrated, address-specific analysis; the stub exists so the wire shape and settlement flow can be exercised in CI and during deployments where the API key is not yet provisioned.`,
    topConcerns,
    scoreBand: c,
    scoreV1Reference: c,
    mena: {
      requestedAttestations:
        c < 60 ? ['counsel.kyb.v1', 'editorial.review.v1'] : [],
      notes:
        'Stub posture; defer to counsel for any MENA institutional attestation strategy.',
    },
  };
}
