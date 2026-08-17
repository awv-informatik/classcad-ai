# sketch.postTrim

Finalizes the trim workflow — **step 3** of `preTrim → trim → postTrim`. It merges the staged split curves back,
removes the staging containers, recreates constraints, and returns the sketch to a normal editable state.

> `postTrim` is the required finalizer after `preTrim` (and any `trim`). See `preTrim.md` for the staging model
> and `trim.md` for segment removal — this doc covers what `postTrim` itself does.

## Signature

```js
api.v1.sketch.postTrim({ id: skId })   // returns VOID (result: null), maxLevel 31
```

Only takes `id` (the **sketch**). Returns **VOID**; distinguish success (mL31) from an error-VOID by `maxLevel`.

## What it does (verified)

- **Cleans the staging.** On a normal `preTrim → trim → postTrim` cycle, **both `SplittedCurves` and `NoneSplitted`
  containers are removed** (gone by name, not merely emptied) — container census returns to baseline, no leak.
- **Returns a genuinely editable, solver-live sketch:** every id resolves (no dead ids), you can add geometry, and
  you can run further full trim cycles. On a **planed** sketch, `updateDimension` after postTrim **re-solves
  (result 1) and moves the geometry** (verified 100→70); on a planeless sketch it returns 0 and nothing moves.
- **Recreates constraints:** geometric constraints come back renamed with a numeric suffix (`Auto_H`→`Auto_H0`)
  with **new ids**, plus an `Auto_Coinc` (`CC_2DCoincidentConstraint`) at each cut vertex (cite preTrim.md).
- **Coalesces** contiguous surviving segments of one source into a single curve — verified live here for **arcs**
  (a 3-way-split arc kept whole → 1 arc); line-coalescing is established in `preTrim.md`.
- **VOID / mL31** on success. Solver-independent (planeless preTrim/trim/postTrim round-trips work).

## Id semantics across postTrim

- **No-trim postTrim (and `trim([])` → postTrim) restores original geometry ids with byte-exact coordinates.**
- **Only actually-trimmed curves get new ids;** untrimmed participants (and keep-all coalesced curves) keep their
  original ids.
- **Constraint AND dimension handles are always recreated with new ids — even on a no-trim postTrim** (e.g. a
  dimension handle id 72→104 with nothing trimmed). **Always re-fetch constraint/dimension handles by NAME after
  postTrim; never cache their ids across it.** (Geometry ids are stable on no-trim; handles are not.)

## Dimensions

- A dimension **survives postTrim only if both its anchor points survive.**
- **If a `trim` removes a segment carrying one of a dimension's anchor points, the dimension is DROPPED** (the
  dimension count decreases; it is not re-anchored). Trimming a dimensioned endpoint silently loses the dimension.
- When the anchors survive, the dimension persists (with a new handle id — re-fetch by name) and still drives geometry.

## Idempotence & no-ops

- **A 2nd `postTrim` back-to-back is a pure no-op** — geometry byte-identical, constraints unchanged (no
  double-suffix `Auto_H00`, no id churn).
- **`postTrim` with nothing staged** (no preceding `preTrim`) is a clean mL31 no-op that **creates no containers**
  (contrast `preTrim`, which creates the containers even on an empty sketch).

## Errors (`{id}`-only surface, result VOID)

| Input | Result |
|---|---|
| missing `id` | mL51 **1004** "must be provided" |
| non-existent id | mL51 **1006** |
| wrong-type id (part / point / curve) | mL51 **1001** `["sketch"]` |

**A mid-workflow error is safe/resumable:** a bad `postTrim` (e.g. wrong-type id) leaves the staging untouched
(`SplittedCurves` childCount unchanged); the correct `postTrim` afterward still finalizes cleanly.

## Gotchas

- **`NoneSplitted0` leak.** Any re-`preTrim` *without an intervening `postTrim`* — a double `preTrim`, **or** a
  `trim` followed by another `preTrim` — leaves a stale **empty `NoneSplitted0` container** after the eventual
  `postTrim`. A subsequent `postTrim` does **not** sweep it; these empties persist and can accumulate. It is
  cosmetic — geometry, original ids, and fresh cycles are unaffected. (TODO #159.)
- **No `StopEditing` endpoint** exists in the v1 API (grep of the API docs: 0 hits), so the guide's "postTrim is auto-called on StopEditing" is
  not directly reachable. However, **`part.closeFeature` on a staged sketch auto-finalizes it** (staging cleaned),
  which is the API-level equivalent of stopping editing.

## Working example

```js
const pre = await api.v1.sketch.preTrim({ id: skId })
await api.v1.sketch.trim({ id: skId, curveIds: [/* segment ids to discard */] })
await api.v1.sketch.postTrim({ id: skId })   // VOID; staging cleaned, constraints recreated, sketch editable again
// re-fetch any dimension/constraint by NAME here — their ids changed
```

## Related

- `sketch.preTrim` — step 1: creates the staging this finalizes. `sketch.trim` — step 2: removes segments.
- `part.closeFeature` — finalizes a staged sketch implicitly (auto-postTrim equivalent).
- `sketch.updateDimension` — works after postTrim on a planed sketch (re-fetch the dimension by name first).
