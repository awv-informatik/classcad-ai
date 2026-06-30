# sketch.trim

Removes staged curve segments produced by `preTrim` — **step 2** of the trim workflow `preTrim → trim → postTrim`.
You select which segments to discard by passing their ids (from `preTrim`'s result); the rest survive into `postTrim`.

> `trim` only makes sense between `preTrim` and `postTrim`. See `preTrim.md` for the workflow, staging model, and
> the round-trip semantics (survivor ids, coalescing, Auto_Coinc) — this doc covers `trim`-specific behavior.

## Signature

```js
api.v1.sketch.trim({ id: skId, curveIds: [seg1, seg2, ...] })   // returns VOID
```

- `id` — the **sketch** id (wrong type → `1001`, expects `["sketch"]`).
- `curveIds` — **staged segment ids from `preTrim.result[].splittedCurves[].id`** (wrong type → `1001`, expects `["sketch-curve"]`).
- Returns **VOID** (`result: null`), maxLevel 31 on success. Drive the ids off `preTrim`'s return value — `getGeometry`
  mid-workflow shows only original ids, not the staged segments.

## What it does (verified)

- **Acts immediately.** A trimmed segment's id is **dead the instant `trim` returns** (`getPositions` → mL51, *before*
  `postTrim`), and the `SplittedCurves` container's child count drops. The segment is **deleted**, not moved to
  `NoneSplitted` and not deferred to `postTrim`.
- **Multi-segment, atomic, order-independent.** Pass any number of segment ids in one call; `[A,B]` and `[B,A]` give the
  same result. Untrimmed sibling segments keep their ids and stay alive until `postTrim`.
- **Disjoint survivors do NOT coalesce.** Coalescing into one curve only happens for *contiguous* survivors of a source
  (see preTrim.md); trimming out the middle leaves separate curves.
- **Trim all segments of a source** → that source curve is fully removed after `postTrim`; crossing curves survive.
- **`trim`-all then `postTrim` → an empty sketch** (lines/arcs/circles/points all 0), no leftover points, no container leak.
- **Arcs trim identically to lines** (a circle's arc segment: VOID, immediate death, survivor arc gets a new id).
- **Solver-independent** — works on a planeless sketch for line and arc segments.

## Validation & error taxonomy (verified)

| Input | Result |
|---|---|
| `curveIds: []` (empty) | **safe no-op, mL31** — nothing removed. *(Note: unlike `preTrim([])`, which means ALL.)* |
| missing `curveIds` | mL51 **1004** "must be provided" |
| missing `id` | mL51 **1004** |
| wrong-type `id` (part/point) | mL51 **1001** `["sketch"]` |
| wrong-type `curveIds` element (sketch/point/constraint id) | mL51 **1001** `["sketch-curve"]` |
| **duplicate seg id `[s,s]`** | **mL51 error (NOT idempotent)** — atomic, other segments untouched. *(Differs from `preTrim`, where duplicate curveIds are accepted.)* |
| bogus / non-existent id | **atomic mL51 1006** (valid segments left untouched; the same id-resolution path emits a preceding level-41 `ToId` warning — observed for preTrim, see preTrim.md) |
| **dead** segment id (already trimmed, or killed by a re-`preTrim`) | **mL51 1006** (dead = non-existent) |
| a real **but unstaged** curve id (an original `sourceId`) | **silent per-element skip, mL31** — it's ignored, and any *valid* segments in the same call are still trimmed |

**The dead-vs-unstaged rule:** a *dead/non-existent* id (bogus, already-trimmed, re-preTrim-killed) **atomic-fails the
whole call with 1006**. A *real-but-unstaged* curve id (a `sourceId` that exists as a whole curve) is a **per-element
silent no-op** — it neither errors nor trims, while valid segment ids in the same batch are still removed.

## Gotchas / footguns

- **`curveIds` is resolved GLOBALLY, not scoped to the `id` sketch.** Passing a segment id that belongs to a
  *different* sketch trims it there (mL31), even though you named another sketch as `id`. Same class of footgun as
  `splitCurve` (TODO #154). Always pass segments from the sketch you're trimming.
- **Passing an original/source curve id silently does nothing** (per-element skip) — only `preTrim` *segment* ids
  actually remove geometry. Easy to think a trim worked when it removed nothing.
- **Never reuse segment ids across a re-`preTrim`** — a second `preTrim` kills the prior batch's ids, and trimming a
  dead id is a 1006 error.

## Scale / hang (the trimCurves concern)

The deprecated sibling `trimCurves` once hung the worker (99% CPU, `kill -9`) at ~39 segments on a sketch with ~20
constraints + 20 dimensions. A **bounded probe** of `trim` (N = 12/24/27 segments, light constraints, zero manual
dimensions) showed **flat ~4–6 ms trim times — no hang and no super-linear growth**. So the hang was
**constraint-density-driven**, not raw segment count, and `trim` does not reproduce it at low density. **Untested
(deliberately, to protect the shared worker):** `trim` under the full heavy-constraint + 39+ segment scenario — verify
before relying on `trim` for very large trims on heavily-constrained sketches.

## Working example

```js
const pre = await api.v1.sketch.preTrim({ id: skId })
// identify the segment ids to discard from pre.result (use getPositions to pick by location)
const toRemove = /* segment ids from pre.result[].splittedCurves[].id */ []
await api.v1.sketch.trim({ id: skId, curveIds: toRemove })   // VOID; segments deleted immediately
await api.v1.sketch.postTrim({ id: skId })                   // finalize → survivors, new ids, coalescing
```

## Related

- `sketch.preTrim` — step 1: stages the splits and gives you the segment ids `trim` consumes (read it first).
- `sketch.postTrim` — step 3: finalizes; trimmed-curve survivors get new ids, untrimmed keep originals. (Own task.)
- `sketch.getPositions` — identify which staged segment is which by endpoint; confirms a trimmed segment is dead.
- `~~sketch.trimCurves~~` (deprecated) — the old step-2 paired with `splitAllCurves`/`splitCurvesMergeBack`; had a
  many-segment worker-hang. Use `trim`.
