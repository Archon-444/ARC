# MENA evidence object — W12 design-partner artifact

This doc + `packages/attestations/scripts/demo-mena.ts` produce the
single JSON envelope a MENA institutional counterparty (DIFC / ADGM /
DMCC-supervised firm; CBUAE-registered stablecoin issuer) typically
wants before transacting with an autonomous agent or treasury wallet.

The W12 acceptance gate from the 90-day plan calls this out specifically:

> Compose `passport + counsel.kyb + token.suitability + stablecoin.reserves`
> into a single MENA-prospect evidence document the design partner can
> hand to compliance.

The envelope is the shippable artifact. The script is the proof that
the five-schema attestation pipeline (W9 + W10) composes correctly,
that off-chain verification recovers the signer cleanly, and that the
shape will not change between today's run and the first real signing
against the deployed `AttestationRegistry`.

---

## Envelope shape

```jsonc
{
  "kind": "arc.evidence.mena.v1",
  "composedAt": "2026-05-13T12:00:00Z",
  "domain": {
    "name": "ARC AttestationRegistry",
    "version": "1",
    "chainId": 5042002,            // Arc testnet
    "verifyingContract": "0x..."   // deployed AttestationRegistry
  },
  "subject": "0x...20",            // the EVM address being vouched for
  "token":   "0x...20",            // the token the suitability assessment covers
  "stablecoin": "0x...20" | null,  // optional, when subject is a stablecoin
  "passport": {
    "subject": "0x...20",
    "passportId": "1" | null,      // null until ArcPassport is deployed
    "metadataURI": "ipfs://...",
    "revoked": false,
    "counselAttestation": "0x...32",
    "source": "on-chain" | "placeholder",
    "notice": "..."
  },
  "attestations": [
    {
      "schemaName": "counsel.kyb.v1",
      "schemaId": "0x...32",
      "signed": {
        "schemaId": "...",
        "primaryType": "counsel.kyb.v1",
        "body": { /* per-schema fields */ },
        "dataHash": "0x...32",     // EIP-712 digest, anchored on-chain
        "signature": "0x...65",
        "signer": "0x...20"
      },
      "verification": {
        "ok": true,
        "recoveredSigner": "0x...20",
        "expectedSigner":  "0x...20"
      }
    },
    /* editorial.review.v1, treasury.policy.v1, token.suitability.v1,
       stablecoin.reserves.v1 */
  ],
  "summary": {
    "attestationCount": 5,
    "allVerified": true,
    "schemasIncluded": [
      "counsel.kyb.v1", "editorial.review.v1", "treasury.policy.v1",
      "token.suitability.v1", "stablecoin.reserves.v1"
    ],
    "passportOnChain": false
  }
}
```

`kind: "arc.evidence.mena.v1"` is the format marker — the downstream
consumer (compliance team's review tool, a hosted dashboard, or
another agent) keys behaviour off this so the field set can evolve
under a v2 without breaking v1 consumers.

`bigint` fields in the body objects (e.g. `treasury.policy.v1`'s
`perTxCeiling`, `stablecoin.reserves.v1`'s `reservesUsd`) are
serialised as decimal strings — JSON has no native bigint and the
canonical wire shape is string, not exponential notation.

---

## How to regenerate the envelope

The script runs entirely offline against deterministic anvil-style
test keys (counsel / editor / treasury / auditor). It needs no
network, no wallet, no deployed contracts.

```sh
# Default subject + token (the script picks sensible test values)
npm --workspace @arc/attestations run demo:mena

# Write the envelope to a file instead of stdout
npm --workspace @arc/attestations run demo:mena -- --out evidence.json

# Custom subject / token / stablecoin (env overrides)
ARC_DEMO_SUBJECT=0x000000000000000000000000000000000000beef \
ARC_DEMO_TOKEN=0x000000000000000000000000000000000000cafe \
ARC_DEMO_STABLECOIN=none \
  npm --workspace @arc/attestations run demo:mena
```

Override knobs:

| Env var | Effect |
|---|---|
| `ARC_DEMO_SUBJECT` | EVM address being vouched for (default `0x1234…5678`) |
| `ARC_DEMO_TOKEN` | Token contract the suitability assessment covers (default Base mainnet USDC) |
| `ARC_DEMO_STABLECOIN` | Stablecoin under `stablecoin.reserves.v1`; pass `none` to skip the schema entirely |
| `ARC_DEMO_REGISTRY` | `AttestationRegistry` deployment address (default placeholder; production runs supply the real one) |

Output: well-formed JSON on stdout, or a file at the `--out` path.

---

## What "verified" means in the envelope

Each attestation in `attestations[]` carries a `verification` block
populated by `verifyAttestation()` from `@arc/attestations`. The check
recomputes the EIP-712 digest from `body + domain + schema.types`,
recovers the signer from the signature, and compares against
`expectedSigner` (the address recorded in `signed.signer`).

For a body that has been tampered with after signing, `recoveredSigner`
diverges and `verification.ok` becomes `false` with reason
`signer-mismatch`. The script asserts `verification.ok` before emitting
the envelope; a verification failure aborts with a non-zero exit code
so consumers never receive an unverified envelope.

In production, the same shape applies — but `expectedSigner` is the
address `AttestationRegistry.getAttestation(id).signer` returns, not
a value the composer chose. The recovered signer must match the
on-chain signer for the envelope to be trustworthy.

---

## Hand-off checklist

Before sending the envelope to a counterparty's compliance team:

- [ ] Replace the placeholder passport block with a real on-chain read
      via `@arc/passport-sdk` once `ArcPassport` is deployed to Arc
      testnet (W11 follow-up; the script's current placeholder block
      is structured to be drop-in replaceable).
- [ ] Run the W9/W10 schemas (`counsel.kyb.v1`, `token.suitability.v1`,
      `stablecoin.reserves.v1`) past counsel for final field-shape
      sign-off. The latter two are marked **counsel-review draft** in
      their source files; production signing waits on counsel.
- [ ] Anchor each `signed.dataHash` on-chain via
      `AttestationRegistry.attest(subject, schemaId, dataHash, expiry)`
      from the appropriate signer wallet (counsel / editor / treasury /
      auditor) so the counterparty can audit-trail every claim back to
      a block on Arc testnet.
- [ ] Confirm `domain.verifyingContract` matches the deployed
      `AttestationRegistry` address recorded in
      `contracts/docs/PASSPORT.md` "Known deployments."
- [ ] Compress or sign the envelope at the transport layer if it will
      leave the host's TLS perimeter (email, ZIP file delivery). The
      schema is integrity-checked, but operational hygiene around
      transit is the operator's responsibility.

---

## Why this is the W12 marquee deliverable

The 90-day plan framed the success condition for the MENA-vertical
pivot as:

> Design-partner evidence object that the design partner can hand to
> compliance.

Everything before W12 was infrastructure: the trust-read API, the
MCP server, the contracts, the schemas. None of those individually
move a counterparty to transact. The envelope does. It is the
JSON-shaped equivalent of the institutional onboarding pack — every
field maps to an evidentiary requirement DFSA / ADGM / CBUAE
supervised firms care about, and every claim is cryptographically
verifiable against a public registry the counterparty can audit
without trusting ARC's word for it.

The script + this doc are the proof of concept; the production
artifact lands when counsel signs off on the two draft schemas and
the operator runs the script with real signers against the deployed
`AttestationRegistry`.
