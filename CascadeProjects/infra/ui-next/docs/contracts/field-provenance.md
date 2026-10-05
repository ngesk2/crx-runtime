# Field-provenance contract (adopt → adapt → delta)

Status: CONTRACT DEFINITION. Archaeology first: this contract adopts PING's
existing evidence vocabulary and adds only the missing delta.

## What exists today (verified 2026-10-04, main ping repo)

### Events carry source identity
`EvidenceAuthority.accumulate()` in `ping-runtime/evidence/evidence_authority.js`
reads event rows as `(event_id, event_type, source, timestamp, payload,
metadata, namespace)`. **Source, timestamp, and namespace already exist on
every event.** `metadata.originator` is the principal slot.

### Ranking already blends confidence × provenance × approval
`EvidenceAuthority.rank()` scores `effectiveConfidence × provenance ×
(approved ? 1.2 : 1.0)`. Notes:
- `provenance` here is a **number** (default 0.5), not a structured record.
- `approved` is a boolean on the result — the seed of HUMAN_CONFIRMED.

### Artifacts carry producer + confidence
Every artifact envelope carries `workerId` (producer) and `confidence`.
Witness artifacts add `artifactHash` + `signature`.

## The gap
No structured per-field provenance record exists. The UI cannot answer
"where did this field come from?" beyond the event's `source` string. There
is no producer/observer distinction, no observed-vs-produced timestamps, no
classification enum, no source-block reference, no change history.

## Proposed shape (adopt existing vocabulary)

```ts
interface FieldProvenance {
  value: unknown;
  provenance: {
    evidenceRefs: string[];   // event_ids backing this field (exists: accumulate())
    sourceRefs: string[];      // event.source strings (exists)
    producer?: { workerId: string }; // exists on artifact envelopes
    observedAt?: string;      // event.timestamp (exists)
    producedAt?: string;      // artifact producedAt (exists on envelope)
    classification:
      | 'OBSERVED'        // straight from an event source
      | 'DERIVED'         // computed from evidence (artifact)
      | 'INFERRED'        // model/agent inference (confidence < 1, unapproved)
      | 'HUMAN_CONFIRMED'; // approved === true (exists as approval state)
    confidence?: number;  // exists (0–1)
    verificationRef?: string; // witness artifactId when witnessed (exists)
    sourceBlockRef?: string;  // MISSING: pointer into the source document block
    changeHistory?: Array<{ at: string; from: unknown; to: unknown; by: string }>; // MISSING
  };
}
```

### Adopt → adapt → delta
- **ADOPT**: `source`, `timestamp`→`observedAt`, `namespace`, `workerId`→producer,
  `confidence`, `approved`→HUMAN_CONFIRMED, witness `artifactId`→verificationRef.
- **ADAPT**: the numeric `provenance` score becomes one input to `confidence`
  display, not the whole story; the classification enum is new but maps 1:1 to
  existing states.
- **DELTA (genuinely missing, needs backend work)**:
  1. `sourceBlockRef` — no pointer from an extracted field back into the source
     document block exists today.
  2. `changeHistory` — no per-field revision log exists today.

## UI rule
Until the delta lands, field provenance renders from the adopted fields with
honest "source block unavailable" / "no change history" states. The
`<ProvenanceBadge />` family (experience lane) must never display a
`sourceBlockRef` or history the backend did not return.
