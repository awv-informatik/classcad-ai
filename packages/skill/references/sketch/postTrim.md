# sketch.postTrim

Finalizes the trim workflow — **step 3** of `preTrim → trim → postTrim` (required after `preTrim`): merges staged curves back, removes staging containers, recreates constraints, returns the sketch to a normal editable state. See `preTrim.md` (staging) and `trim.md` (segment removal).

## Key Parameters

`api.v1.sketch.postTrim({ id: skId })` — only the **sketch** id. Returns VOID; tell success (mL31) from error-VOID by `maxLevel`. Solver-independent (planeless round-trips work).

## Behavior

- **Cleans staging:** `SplittedCurves` and `NoneSplitted` are removed (gone by name, not emptied) — container census back to baseline.
- **Editable, solver-live sketch:** every id resolves, you can add geometry and run further trim cycles. On a **planed** sketch `updateDimension` re-solves (result 1) and moves geometry (100→70); planeless returns 0, nothing moves.
- **Recreates constraints:** numeric-suffix names (`Auto_H`→`Auto_H0`), **new ids**, plus `Auto_Coinc` (`CC_2DCoincidentConstraint`) at each cut vertex.
- **Coalesces** contiguous surviving segments of one source (arcs: a 3-way-split arc kept whole → 1 arc; lines: see `preTrim.md`).

## Id semantics

- **No-trim postTrim (and `trim([])` → postTrim) restores original geometry ids, byte-exact coordinates.**
- **Only actually-trimmed curves get new ids;** untrimmed participants (and keep-all coalesced curves) keep theirs.
- **Constraint AND dimension handles are ALWAYS recreated with new ids — even with nothing trimmed** (dimension 72→104). **Re-fetch by NAME after postTrim; never cache their ids across it.**

## Dimensions

- Survives only if **both anchor points survive**. Trimming a segment carrying an anchor **DROPS the dimension** silently (count decreases, not re-anchored).
- Surviving dims keep driving geometry (new handle id).

## Idempotence & errors

- **2nd `postTrim` back-to-back:** pure no-op (byte-identical, no `Auto_H00`, no id churn).
- **Nothing staged** (no `preTrim`): clean mL31 no-op, **creates no containers** (unlike `preTrim` on an empty sketch).

| Input | Result |
|---|---|
| missing `id` | mL51 **1004** "must be provided" |
| nonexistent id | mL51 **1006** |
| wrong-type id (part/point/curve) | mL51 **1001** `["sketch"]` |

**Errors are resumable:** a bad `postTrim` leaves staging untouched (`SplittedCurves` childCount unchanged); the correct call still finalizes.

## Gotchas

- **`NoneSplitted0` leak.** Any re-`preTrim` without an intervening `postTrim` (double `preTrim`, or `trim` then `preTrim`) leaves an empty `NoneSplitted0` after the eventual `postTrim`. Later postTrims don't sweep it; they accumulate. Cosmetic — geometry, ids, fresh cycles unaffected.
- **No `StopEditing` endpoint** in v1 (0 hits in API docs), so "postTrim auto-called on StopEditing" isn't reachable — but **`part.closeFeature` on a staged sketch auto-finalizes it** (staging cleaned).

## Working example

```js
const partId = (await api.v1.part.create({ name: 'P' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const h = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [100, 50, 0] })).result
await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 100, 0] })

const pre = await api.v1.sketch.preTrim({ id: skId })
const seg = pre.result.find(e => e.sourceId === h).splittedCurves.find(s => s.interval[0] > 0).id
await api.v1.sketch.trim({ id: skId, curveIds: [seg] })
await api.v1.sketch.postTrim({ id: skId }) // staging cleaned; re-fetch constraints/dimensions by NAME
```

## Related

`sketch.preTrim` · `part.closeFeature` · `sketch.updateDimension`
