# MENA institutional cold-outreach template

> **Counsel-review pending.** Do not send any version of this template that names regulators or makes regulatory claims without first running it past counsel. The schema-mapping framing (DFSA Crypto Token framework → `token.suitability.v1`; ADGM FRT regime → `stablecoin.reserves.v1`) is a positioning statement, not a regulatory representation. The actual evidence-object is `counsel-review pending` until counsel signs off on the field shape.

## Audience

DIFC-licensed institutional firms with treasury or token operations that have to document suitability under the DFSA Crypto Token framework (effective Jan 2026), or stablecoin-adjacent firms operating under ADGM's FRT regime. Specifically: treasury operations of crypto-fintechs, family-office crypto desks, regulated stablecoin issuers, and institutional custody operators.

This is **not** for retail crypto businesses or for unregulated launchpads.

## Lead artifact

The W12 MENA evidence-object: [`packages/attestations/scripts/demo-mena.ts`](../../packages/attestations/scripts/demo-mena.ts) generates a `arc.evidence.mena.v1` JSON envelope composing all five attestation schemas (counsel.kyb.v1 + editorial.review.v1 + treasury.policy.v1 + token.suitability.v1 + stablecoin.reserves.v1) into a single signed-and-verified document. Walkthrough in [`docs/demo-mena.md`](../demo-mena.md). The hosted version of this envelope is what the design-partner conversation is anchored on.

## Template

Subject lines (pick one — A/B is the polite framing, C is the directly value-stating framing):

- A. "Documented token-suitability evidence for DFSA / ADGM — quick conversation?"
- B. "Trust layer for agent-driven treasury operations — design-partner ask"
- C. "Machine-readable suitability evidence for the Jan 2026 framework — would 30 mins make sense?"

Body:

> Dear [first name],
>
> [One-sentence personalisation. Reference something specific — a recent license filing, a published treasury policy, a public conference talk. If you have nothing specific, do not send the email; cold-outreach without personalisation is worse than no outreach.]
>
> I'm reaching out because [firm name]'s treasury / token operations now sit inside the DFSA Crypto Token framework (effective January 2026) [and/or the ADGM FRT regime]. Both regimes require firms to document token suitability and reserve composition as part of the suitability assessment. ARC ships the trust, identity, and editorial-verification layer for that work.
>
> The marquee artifact is the [MENA evidence-object](../../packages/attestations/scripts/demo-mena.ts) — a single signed JSON envelope composing five EIP-712-typed attestations: counsel-led KYB, editorial review, treasury policy, token suitability (DFSA-mapped), and stablecoin reserves (ADGM FRT-mapped). On-chain anchors via the AttestationRegistry on Arc testnet; off-chain bodies in IPFS; counsel attestation as the trust anchor.
>
> What I'd like to ask for: 30 minutes to walk through the envelope format on a screen-share, see whether the field shape matches your evidentiary burden, and get your read on what would have to be true for [firm name] to consider being an early design partner. No pricing conversation in the first call; the design-partner program is currently invitation-only and counsel-led.
>
> Repository (open-source schemas + contracts; the hosted offering is closed): https://github.com/archon-444/arc
> Strategic frame: [docs/strategic-environment.md](../strategic-environment.md)
> Forrester framing: "No human decision point exists between resource request and payment execution." — agent commerce moves money before any human reviews; we are the layer that does the work a human would have done.
>
> Would Thursday or next Tuesday work? I can do morning Dubai time or evening UK time.
>
> Best,
> [name]
> ARC

## Tone notes

- **Do not promise compliance.** ARC is the evidence layer firms use to *document* their assessment, not a substitute for the assessment. Counsel-led posture in every paragraph.
- **Do not promise regulator-readiness.** No regulator has endorsed ARC. Schemas map onto the documented evidentiary burdens; that is a positioning statement, not a regulatory representation.
- **Do not name competitors in the email.** Stripe, Mastercard, Circle, Coinbase — none of them belong in a first-touch DIFC institutional email.
- **Do not attach the JSON envelope to the email.** Link to the script + the doc; if they want a sample envelope, generate one in the call against an address they pick.
- **Do not send to a personal Gmail.** Institutional addresses only. If you only have a personal address, the firm is not the right design partner.

## Follow-up cadence

- T+0: send.
- T+5 days, if no reply: one polite nudge with a different subject line. Reference one new artifact (e.g. the public W16 announcement post if it has shipped).
- T+12 days, no reply: stop. Mark `no-response` in `outreach-log.md`. Do not send a third touch — institutional cold-outreach has a hard two-touch limit.

## Cross-references

- [`docs/mena/candidate-firms.md`](./candidate-firms.md) — list of 3–5 DIFC firms to consider for the first wave.
- [`docs/mena/outreach-log.md`](./outreach-log.md) — operator-fired log capturing the three sends that satisfy W16 acceptance item 4.
- [`docs/demo-mena.md`](../demo-mena.md) — full walkthrough of the evidence-object.
- [`docs/strategic-environment.md`](../strategic-environment.md) — the public framing referenced in the email body.
