# MENA outreach log

> **Operator-fired.** Three populated rows in the ledger below is the gate for [W16 acceptance item 4](../../STRATEGIC_PIVOT.md). The format is PII-free: initials + firm name + regulatory regime, never personal email or phone.
>
> **Do not commit** any row that contains a personal email address, phone number, or quote that the recipient did not pre-clear for repository inclusion. If a follow-up requires recording sensitive content, keep that content in a private operator note outside the repo and reference it here as `[private note]`.

## Ledger

| Date (UTC) | Firm | Bucket (A/B/C) | Contact role + initials | Channel | Counsel-cleared (Y/N) | Response summary | Next action |
|---|---|---|---|---|---|---|---|
| _pending_ | _firm 1_ | _A or B or C_ | e.g. "Compliance Officer · J.S." | email / LinkedIn / warm intro | _N (until counsel signs off the template)_ | _to fill after T+5 days_ | _to fill_ |
| _pending_ | _firm 2_ | _A or B or C_ | _initials_ | _channel_ | _N_ | _to fill_ | _to fill_ |
| _pending_ | _firm 3_ | _A or B or C_ | _initials_ | _channel_ | _N_ | _to fill_ | _to fill_ |

## How to add a row

1. Pick a candidate from [`candidate-firms.md`](./candidate-firms.md) and personalise the [`outreach-template.md`](./outreach-template.md) to that firm.
2. **Run the personalised draft past counsel before sending.** Flip the `Counsel-cleared` cell to `Y` only after counsel signs off on the specific draft.
3. Send.
4. Add a row to the ledger above:
   - Date: send date in UTC.
   - Firm: legal entity name.
   - Bucket: which `candidate-firms.md` bucket they're from.
   - Contact role + initials: never the full name; never the email address.
   - Channel: how the message was delivered.
   - Counsel-cleared: Y/N.
   - Response summary: short factual summary; not a quote unless pre-cleared.
   - Next action: what happens next, with a UTC date if a follow-up is planned.
5. Update follow-up cadence per the template (T+5 nudge; T+12 stop).

## Statuses

| Status | Meaning |
|---|---|
| `sent` | First touch out; no response yet. |
| `nudged` | T+5 reminder sent; no response. |
| `no-response` | T+12 reached without a reply. Stop touches. |
| `meeting-booked` | Call on calendar. Add UTC date in the Next action column. |
| `meeting-done` | Walk-through completed. Add summary of design-partner appetite. |
| `design-partner-cleared` | Counsel + commercial both clear; ready for the design-partner program. |
| `pass` | Firm declined or doesn't fit. Note the reason in the response summary. |

## Gate-closure rule

W16 acceptance item 4 closes when:
- Three rows above are populated with real firm names + dates,
- Each row has `Counsel-cleared: Y`,
- Each row has at minimum a `sent` status (response is **not** required for the gate).

Conversion (meetings booked, design-partners cleared) is W17+ work. W16 is the outreach gate, not the conversion gate.

## Cross-references

- [`outreach-template.md`](./outreach-template.md) — the email template.
- [`candidate-firms.md`](./candidate-firms.md) — first-wave shortlist by bucket.
- [`packages/attestations/scripts/demo-mena.ts`](../../packages/attestations/scripts/demo-mena.ts) — the lead artifact every email references.
- [`docs/announcements/W16-operator-go-live.md`](../announcements/W16-operator-go-live.md) — parallel public framing.
