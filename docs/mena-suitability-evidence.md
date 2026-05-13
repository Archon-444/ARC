# MENA suitability evidence — schema drafts

> **COUNSEL-REVIEW DRAFT — NOT FOR PRODUCTION ATTESTATIONS.**
> This document is the working specification for two MENA-mapped
> attestation schemas that the W9–W10 milestones will publish as
> EIP-712 typed-data via `@arc/attestations` and registered in
> `AttestationRegistry.sol` on Arc testnet. Field names, evidentiary
> burdens, retention requirements, and the exact mapping of regulatory
> criteria to JSON Schema fields **MUST** be reviewed by counsel
> qualified in the relevant jurisdiction (DFSA, ADGM FSRA) before
> being signed and attached to any real `passportId`. Drafting date:
> 2026-05-13. Sources cited inline. **Do not use for any real
> compliance, suitability, or institutional pitch decision.**

## Why this exists

The 90-day pivot positions ARC as the independent trust, identity, and
editorial-verification overlay for Circle-native agent commerce, with
MENA institutional / treasury agent commerce as the wedge vertical.
Two regulatory regimes anchor that wedge:

1. **DFSA Crypto Token framework** (Dubai Financial Services Authority,
   ruleset effective Jan 2026). Documented-suitability responsibility
   sits on the firm. The framework enumerates criteria a firm must
   reason about before recommending or transacting a crypto token to
   its clients — `token.suitability.v1` captures the firm's reasoning
   over those criteria into a signed attestation the agent can verify.

2. **ADGM Fiat-Referenced Token (FRT) framework** (Abu Dhabi Global
   Market, Financial Services Regulatory Authority, finalised regime).
   FRTs (stablecoins) must demonstrate reserve composition, governance,
   disclosure, prudential, and redemption criteria — `stablecoin.reserves.v1`
   captures that demonstration into a signed attestation.

Both schemas exist so an agent calling `arc_trust_read(<token>)` over
MCP can, on top of the heuristic `scoreV1`, surface independently
signed evidence that a human counsel actually evaluated the token
against the regulator's checklist. The schemas are the wire format;
the registry stores the hash; the body lives in IPFS / S3; the
attester is gated by `COUNSEL_ROLE` on `AttestationRegistry`.

These two schemas join the v0 set (`counsel.kyb.v1`, `editorial.review.v1`,
`treasury.policy.v1`) shipped in W9.

---

## 1. DFSA mapping → `token.suitability.v1`

### Criteria (sources to confirm with counsel)

The DFSA framework requires the firm to consider, at minimum, the
following dimensions of a crypto token before treating it as suitable
for a client or counterparty:

| # | Criterion | Evidentiary burden the firm must discharge |
|---|---|---|
| 1 | **Token characteristics** | What is it (utility / security / payment / governance), how is it issued, what rights does it confer, what is the supply schedule, is it transferable? |
| 2 | **Regulatory status in other jurisdictions** | Where else is it regulated, by which regulator, under which classification, with what conditions, and what is the firm's view of comparability to DFSA classification? |
| 3 | **Market size and trading history** | Size and depth of the market, liquidity, age of the token, volatility, history of incidents (de-pegs, hacks, governance disputes). |
| 4 | **Technology stack** | Underlying chain(s), smart contract audit status, key cryptographic and economic assumptions, upgrade governance, custody assumptions. |
| 5 | **AML / sanctions risk exposure** | Sanctions screening posture, mixer/coin-join exposure heuristics, OFAC / UN / UK / EU lists checked, frequency of rescreen, residual risk view. |
| 6 | **Impairment of DFSA-administered legislation** | The firm's reasoned view that use of the token would not impair any DFSA-administered legislation (market abuse, AML / CFT, conduct, custody, prudential). |

### Schema (Draft 2020-12, illustrative)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arc.example.com/schemas/token.suitability.v1.json",
  "title": "token.suitability.v1",
  "type": "object",
  "required": [
    "schemaId",
    "subject",
    "jurisdiction",
    "issuedAt",
    "expiresAt",
    "counselAttester",
    "criteria",
    "overallOpinion"
  ],
  "properties": {
    "schemaId": { "const": "token.suitability.v1" },
    "subject": {
      "type": "object",
      "required": ["chainId", "tokenAddress"],
      "properties": {
        "chainId": { "type": "integer" },
        "tokenAddress": { "type": "string", "pattern": "^0x[a-fA-F0-9]{40}$" },
        "ticker": { "type": "string" }
      }
    },
    "jurisdiction": { "const": "DFSA" },
    "issuedAt": { "type": "string", "format": "date-time" },
    "expiresAt": { "type": "string", "format": "date-time" },
    "counselAttester": {
      "type": "object",
      "required": ["firm", "address"],
      "properties": {
        "firm": { "type": "string" },
        "address": { "type": "string", "pattern": "^0x[a-fA-F0-9]{40}$" },
        "licenseRef": { "type": "string" }
      }
    },
    "criteria": {
      "type": "object",
      "required": [
        "characteristics",
        "regulatoryStatusElsewhere",
        "marketSizeAndHistory",
        "technology",
        "amlSanctions",
        "dfsaImpairment"
      ],
      "properties": {
        "characteristics": { "$ref": "#/$defs/finding" },
        "regulatoryStatusElsewhere": { "$ref": "#/$defs/finding" },
        "marketSizeAndHistory": { "$ref": "#/$defs/finding" },
        "technology": { "$ref": "#/$defs/finding" },
        "amlSanctions": { "$ref": "#/$defs/finding" },
        "dfsaImpairment": { "$ref": "#/$defs/finding" }
      }
    },
    "overallOpinion": {
      "type": "string",
      "enum": ["suitable", "suitable-with-conditions", "not-suitable", "no-opinion"]
    },
    "conditions": { "type": "array", "items": { "type": "string" } },
    "evidenceURIs": {
      "type": "array",
      "items": { "type": "string", "format": "uri" },
      "description": "IPFS or S3 URIs to underlying memos / audit reports / screening logs."
    }
  },
  "$defs": {
    "finding": {
      "type": "object",
      "required": ["status", "summary"],
      "properties": {
        "status": { "type": "string", "enum": ["satisfied", "partial", "unsatisfied", "n/a"] },
        "summary": { "type": "string", "maxLength": 2000 },
        "evidenceURIs": { "type": "array", "items": { "type": "string", "format": "uri" } }
      }
    }
  }
}
```

### Example

```json
{
  "schemaId": "token.suitability.v1",
  "subject": { "chainId": 8453, "tokenAddress": "0xabc...", "ticker": "EXAMPLE" },
  "jurisdiction": "DFSA",
  "issuedAt": "2026-05-12T10:00:00Z",
  "expiresAt": "2026-11-12T10:00:00Z",
  "counselAttester": {
    "firm": "Counsel Firm LLP, DIFC branch",
    "address": "0xdef...",
    "licenseRef": "DIFC-LP-NNNN"
  },
  "criteria": {
    "characteristics": { "status": "satisfied", "summary": "Payment token, fixed supply, transferable; ..." },
    "regulatoryStatusElsewhere": { "status": "partial", "summary": "Registered with CBUAE as FPT; not classified by SEC; ..." },
    "marketSizeAndHistory": { "status": "satisfied", "summary": "12-month median volume $X; no de-peg events; ..." },
    "technology": { "status": "satisfied", "summary": "Base L2 USDC reserve token; OpenZeppelin contracts audited by ...; ..." },
    "amlSanctions": { "status": "satisfied", "summary": "OFAC + UN + UK + EU rescreened weekly; ..." },
    "dfsaImpairment": { "status": "satisfied", "summary": "No conflict with market abuse, AML / CFT, conduct, custody, or prudential rules; ..." }
  },
  "overallOpinion": "suitable-with-conditions",
  "conditions": [
    "Re-attest if reserve attestor or banking partner changes.",
    "Hard-cap exposure to 5% NAV per institutional client."
  ],
  "evidenceURIs": [
    "ipfs://bafybeibwzifw7mxlbmkvzgyl..."
  ]
}
```

---

## 2. ADGM FRT mapping → `stablecoin.reserves.v1`

### Criteria (sources to confirm with counsel)

The ADGM FSRA Fiat-Referenced Token framework imposes ongoing
obligations on FRT issuers covering reserves, governance, disclosure,
prudential capital, and redemption. The schema captures the issuer's
demonstration of each dimension, signed by counsel after review.

| # | Criterion | Evidentiary burden the issuer must demonstrate |
|---|---|---|
| 1 | **Reserve composition + segregation** | What assets back the token (cash / T-bills / repos / ...), in what proportions, with what counterparties, segregated from operating funds. |
| 2 | **Reserve audit cadence + auditor** | Frequency of independent reserve attestation, identity and licensing of the auditor, scope of the engagement, public availability of attestations. |
| 3 | **Governance** | Board composition, key-person dependencies, conflict-of-interest controls, change-of-control conditions, regulatory contact. |
| 4 | **Disclosure cadence** | Monthly / quarterly disclosure obligations met, last published date, content of disclosures vs. ADGM requirements. |
| 5 | **Prudential capital** | Minimum capital held, capital adequacy ratio, stress-test approach, recovery plan. |
| 6 | **Redemption rights + coverage** | Who can redeem, time-to-cash SLA, fees, capacity demonstrated under stress, queueing rules. |

### Schema (Draft 2020-12, illustrative)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arc.example.com/schemas/stablecoin.reserves.v1.json",
  "title": "stablecoin.reserves.v1",
  "type": "object",
  "required": [
    "schemaId",
    "subject",
    "jurisdiction",
    "issuedAt",
    "expiresAt",
    "counselAttester",
    "criteria",
    "overallOpinion"
  ],
  "properties": {
    "schemaId": { "const": "stablecoin.reserves.v1" },
    "subject": {
      "type": "object",
      "required": ["chainId", "tokenAddress", "issuerLegalName"],
      "properties": {
        "chainId": { "type": "integer" },
        "tokenAddress": { "type": "string", "pattern": "^0x[a-fA-F0-9]{40}$" },
        "ticker": { "type": "string" },
        "issuerLegalName": { "type": "string" }
      }
    },
    "jurisdiction": { "const": "ADGM-FSRA-FRT" },
    "issuedAt": { "type": "string", "format": "date-time" },
    "expiresAt": { "type": "string", "format": "date-time" },
    "counselAttester": {
      "type": "object",
      "required": ["firm", "address"],
      "properties": {
        "firm": { "type": "string" },
        "address": { "type": "string", "pattern": "^0x[a-fA-F0-9]{40}$" },
        "licenseRef": { "type": "string" }
      }
    },
    "criteria": {
      "type": "object",
      "required": [
        "reserveComposition",
        "reserveAudit",
        "governance",
        "disclosureCadence",
        "prudentialCapital",
        "redemption"
      ],
      "properties": {
        "reserveComposition": {
          "allOf": [
            { "$ref": "#/$defs/finding" },
            {
              "type": "object",
              "properties": {
                "breakdown": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["assetClass", "share"],
                    "properties": {
                      "assetClass": { "type": "string", "enum": ["cash", "tbill", "repo", "moneyMarket", "other"] },
                      "share": { "type": "number", "minimum": 0, "maximum": 1 },
                      "custodian": { "type": "string" }
                    }
                  }
                }
              }
            }
          ]
        },
        "reserveAudit": {
          "allOf": [
            { "$ref": "#/$defs/finding" },
            {
              "type": "object",
              "properties": {
                "auditor": { "type": "string" },
                "cadence": { "type": "string", "enum": ["monthly", "quarterly", "semiannual", "annual"] },
                "lastAttestationDate": { "type": "string", "format": "date" }
              }
            }
          ]
        },
        "governance": { "$ref": "#/$defs/finding" },
        "disclosureCadence": { "$ref": "#/$defs/finding" },
        "prudentialCapital": { "$ref": "#/$defs/finding" },
        "redemption": {
          "allOf": [
            { "$ref": "#/$defs/finding" },
            {
              "type": "object",
              "properties": {
                "timeToCashHours": { "type": "number", "minimum": 0 },
                "minimumRedemptionAmount": { "type": "string" }
              }
            }
          ]
        }
      }
    },
    "overallOpinion": {
      "type": "string",
      "enum": ["compliant", "compliant-with-conditions", "non-compliant", "no-opinion"]
    },
    "conditions": { "type": "array", "items": { "type": "string" } },
    "evidenceURIs": {
      "type": "array",
      "items": { "type": "string", "format": "uri" }
    }
  },
  "$defs": {
    "finding": {
      "type": "object",
      "required": ["status", "summary"],
      "properties": {
        "status": { "type": "string", "enum": ["satisfied", "partial", "unsatisfied", "n/a"] },
        "summary": { "type": "string", "maxLength": 2000 },
        "evidenceURIs": { "type": "array", "items": { "type": "string", "format": "uri" } }
      }
    }
  }
}
```

### Example

```json
{
  "schemaId": "stablecoin.reserves.v1",
  "subject": {
    "chainId": 8453,
    "tokenAddress": "0xabc...",
    "ticker": "USDU",
    "issuerLegalName": "Issuer FZ-LLC, ADGM"
  },
  "jurisdiction": "ADGM-FSRA-FRT",
  "issuedAt": "2026-05-12T10:00:00Z",
  "expiresAt": "2026-08-12T10:00:00Z",
  "counselAttester": {
    "firm": "Counsel Firm LLP, ADGM branch",
    "address": "0xdef...",
    "licenseRef": "ADGM-FSP-NNNN"
  },
  "criteria": {
    "reserveComposition": {
      "status": "satisfied",
      "summary": "100% USD-equivalent: 30% cash, 70% short-dated T-bills.",
      "breakdown": [
        { "assetClass": "cash", "share": 0.30, "custodian": "Bank A" },
        { "assetClass": "tbill", "share": 0.70, "custodian": "Bank A" }
      ]
    },
    "reserveAudit": {
      "status": "satisfied",
      "summary": "Monthly attestation by Big4 firm; latest 2026-04-30 published.",
      "auditor": "Big4 LLP",
      "cadence": "monthly",
      "lastAttestationDate": "2026-04-30"
    },
    "governance": { "status": "satisfied", "summary": "Board of 5, 2 independent; conflict policy adopted; ..." },
    "disclosureCadence": { "status": "satisfied", "summary": "Monthly public disclosure 2026-04 published; ..." },
    "prudentialCapital": { "status": "satisfied", "summary": "Capital above ADGM FRT minimum; ratio X%; recovery plan filed." },
    "redemption": {
      "status": "satisfied",
      "summary": "T+1 cash redemption; no fee for verified holders ≤ $10M; queueing under stress documented.",
      "timeToCashHours": 24,
      "minimumRedemptionAmount": "0"
    }
  },
  "overallOpinion": "compliant",
  "evidenceURIs": [
    "ipfs://bafybei...attestation-2026-04",
    "ipfs://bafybei...board-charter"
  ]
}
```

---

## Counsel review checklist

Before any signed attestation is attached to a real `passportId` on
Arc testnet via `AttestationRegistry.attest()`:

- [ ] **Jurisdictional fit** — confirm that the cited DFSA / ADGM
  rulebook references are current at the time of attestation and that
  the firm signing is licensed in the cited jurisdiction.
- [ ] **Field completeness** — confirm that the 6 criteria per schema
  are the minimum and that nothing material has been left out (e.g.
  custody, segregation, conduct, market abuse). Add fields, don't
  rename them — schema versions are immutable once registered.
- [ ] **Evidentiary burden** — confirm that the `summary` + `evidenceURIs`
  combination is enough for the firm to defend the attestation if
  examined by the regulator. The chain stores only the hash; the
  defensible evidence must live in IPFS / S3 with retention.
- [ ] **Retention policy** — confirm that off-chain `evidenceURIs`
  must remain accessible for the regulator-mandated retention period
  (DFSA 6 years; ADGM 7 years — confirm). The registry holds the hash
  forever; the body must outlive `expiresAt`.
- [ ] **Personal-data minimisation** — confirm that no attested
  document carries unminimised personal data of underlying clients.
  KYB / suitability attestations are about the **issuer** and the
  **firm's reasoning**, not the firm's clients.
- [ ] **Revocation flow** — confirm that the firm understands the
  `AttestationRegistry.revoke(id)` semantics: revocation is on-chain
  and immediate; off-chain caches at consumers (e.g. `trust-api`)
  must respect the revocation event.
- [ ] **Signing key custody** — confirm that the `counselAttester.address`
  key is held under the firm's custody policy, not in an ARC-controlled
  wallet.

Once counsel has reviewed and signed off on the schema shape and the
review checklist, the schemas move from `docs/` into
`packages/attestations/schemas/` as TypeScript constants and EIP-712
typed-data, and are registered in `AttestationRegistry.sol` in W9–W10.
