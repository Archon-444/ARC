# MENA candidate firms — first-wave outreach shortlist

> **Operator-fired**. This list seeds the W16 acceptance item 4 (three DIFC firms contacted with the MENA evidence-object as the lead artifact). The candidates below are public-info-only — license type, treasury-style disclosure, regulatory regime — and are not endorsements or relationships. The operator (founder, UAE-based) selects three from this list filtered by their personal network; the rest are reference candidates for the W17+ second wave.
>
> **Important:** before sending anything to anyone on this list, run the [`outreach-template.md`](./outreach-template.md) past counsel. The schema mapping is a positioning statement, not a regulatory representation. Templates without personalisation are worse than no outreach.

## Bucket A — DFSA-licensed crypto firms (DIFC)

Firms operating under the DFSA Crypto Token framework that have a documented suitability assessment burden. Look for: token-related licenses issued post-2024, public disclosure of a treasury or operational-crypto activity, and a publicly named compliance lead.

| Candidate type | Why a fit | Where to find public info | First-touch frame |
|---|---|---|---|
| DFSA-recognised crypto exchange | Has to document suitability of every listed token under the Jan 2026 framework | DFSA public register; the firm's own listings page | "The `token.suitability.v1` schema maps onto the framework's evidentiary fields — would you be open to seeing the envelope?" |
| DFSA-licensed crypto custody or staking provider | Token suitability + reserve composition both apply | DFSA register; the firm's policy disclosures | "Custody operators have the deepest evidentiary burden under the Jan 2026 framework — the evidence-object is built for exactly that workflow." |
| Crypto-fintech with DIFC treasury operations | Treasury policy + token suitability + (if they touch stablecoins) reserve composition | LinkedIn for the treasury / compliance lead; press releases | "ARC's evidence-object is what your auditor would want; would it help to see the format?" |

## Bucket B — ADGM FRT regime firms

Firms operating under ADGM's Foreign Reserve Tokens regime — primarily stablecoin issuers and stablecoin-corridor operators.

| Candidate type | Why a fit | Where to find public info | First-touch frame |
|---|---|---|---|
| ADGM-licensed stablecoin issuer (incl. USDU and successors) | `stablecoin.reserves.v1` is ADGM-FRT-mapped | ADGM public register; CBUAE registrations | "The `stablecoin.reserves.v1` schema is built against the FRT prudential and disclosure requirements — would you walk through the field shape with us?" |
| Cross-corridor payment operator (UAE ↔ EMEA / Asia) using a regulated stablecoin | Reserve composition + counterparty KYB | Industry publications; corridor announcements | "Counterparty KYB attestations + reserve coverage is the combined ask for cross-corridor flow — ARC's envelope covers both." |

## Bucket C — Family-office crypto desks (off-the-record)

Family offices in the UAE with treasury-style crypto exposure. These are not regulated under DFSA or ADGM directly but their advisors do require documented assessments. **Pass operator-discretion only** — these are network-introduction conversations, not cold-outreach.

| Candidate type | Why a fit | Where to find public info | First-touch frame |
|---|---|---|---|
| Single-family office with disclosed crypto allocation | Their compliance / family lawyer will want documented suitability evidence even if not regulated to do so | LinkedIn; Wealth-X disclosure (cautiously) | Network introduction only. Frame: "documented suitability evidence for the family-office crypto allocation." |

## Selection criteria for the first three

For W16 acceptance item 4, the operator picks **three firms** from the buckets above with:

1. A real personalisation hook (a recent announcement, a connection, a publicly named compliance lead with a discoverable email).
2. A public regulatory posture that the email body can reference truthfully (DFSA license, ADGM license, CBUAE registration — at least one).
3. A plausible 30-min conversation in the next 14 days (the firm is operating, not just licensed; people are reachable).

If only one or two candidates meet all three criteria, the gate is still three sent — the third can come from the operator's existing network (Bucket C with a warm intro) rather than reaching for a cold candidate that doesn't fit.

## What this list deliberately omits

- Named individual firms. The list above is by category. Operator picks specific firms from their network; this doc does not name them so the file can stay public.
- Compliance-officer or treasury-lead names. Those go in the operator's outreach log, never in the repo.
- Pricing positioning. No first-touch email mentions pricing.
- A "tier" or "priority" ranking. All three buckets are valid first-wave; the operator picks based on personalisation strength, not bucket order.

## Cross-references

- [`docs/mena/outreach-template.md`](./outreach-template.md) — the cold-outreach template referenced by every send.
- [`docs/mena/outreach-log.md`](./outreach-log.md) — operator-fired log capturing the three sends.
- [`packages/attestations/scripts/demo-mena.ts`](../../packages/attestations/scripts/demo-mena.ts) — the lead artifact.
- [`docs/mena-suitability-evidence.md`](../mena-suitability-evidence.md) — counsel-review draft of the schemas referenced in the email.
