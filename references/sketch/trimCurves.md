# sketch.trimCurves

Removes split sub-curves from the SplittedCurves container. **Does NOT modify visible geometry by itself** — you must call `splitCurvesMergeBack` afterward to apply the changes.

## The Trim Workflow (3 steps, all required)

```
splitAllCurves → trimCurves → splitCurvesMergeBack
```

1. **`splitAllCurves({ id })`** — splits all curves at their intersection points. Returns an array of sub-curve IDs (the "trimmable" curves). Non-intersecting curves appear as their original IDs.
2. **`trimCurves({ id, curveIds })`** — removes specified sub-curves from the internal SplittedCurves container. Returns VOID. No visible change yet.
3. **`splitCurvesMergeBack({ id })`** — applies the trims to actual sketch geometry. Original curves are replaced by new curves (new IDs) reflecting the trimmed state.

Skipping step 3 leaves the sketch visually unchanged. The trim is only staged, not applied.

## Prerequisites

- A sketch with at least one curve
- `splitAllCurves` must be called first to create the split sub-curves that `trimCurves` operates on

## Key Parameters

- `id` — sketch ID (required)
- `curveIds` — array of sub-curve IDs from `splitAllCurves` result (required). Pass IDs of segments you want to **remove**.

## Return Value

VOID. No meaningful return value.

## Gotchas

- **trimCurves alone does nothing visible.** The original curves remain rendered until `splitCurvesMergeBack` is called. This is the #1 mistake — always merge back after trimming.
- **Passing original curve IDs (not split sub-curves) is a silent no-op.** No error, no effect. Only IDs returned by `splitAllCurves` work.
- **trimCurves is atomic.** If ANY ID in `curveIds` is invalid, the entire call fails (maxLevel=51) and NO segments are trimmed — even the valid ones.
- **splitAllCurves returns ALL curves**, including non-intersecting ones. Non-intersected curves appear as their original IDs. You can trim these too — after mergeBack, the curve is deleted entirely.
- **After mergeBack, all IDs change.** Original curve IDs are invalidated. New geometry gets new IDs. Don't cache IDs across the trim workflow.
- **Re-trimming an already-trimmed ID errors.** The sub-curve no longer exists after the first trim — second attempt returns maxLevel=51 "invalid id" error.
- **Empty `curveIds` array is a no-op.** No error (maxLevel=31).
- **Safe on constrained sketches** (verified 2026-06-10): constraints/dimensions survive the
  trim workflow and the profile stays conditioned — but ALL constraint/dimension handles are
  recreated with new IDs on mergeBack (re-fetch by name), and `Auto_Coinc` constraints appear
  at the cut points. Full details in `splitCurvesMergeBack.md` → Constrained Sketches.

## How splitAllCurves Segments Map to Geometry

For a circle (radius 30) intersected by a horizontal line:
- Circle → 2 arcs: `Circle_part0` (upper), `Circle_part1` (lower)
- Line → 3 segments: `Line_part0` (left), `Line_part1` (middle/inside circle), `Line_part2` (right)

Naming pattern: `{OriginalName}_part{N}` (CC_Line or CC_Arc class). Segments are children of a `SplittedCurves` (CC_Container) node in the structure tree.

## Common Errors

| Scenario | maxLevel | Message |
|---|---|---|
| Invalid ID in curveIds | 51 | "An element of parameter curveIds has an invalid id!" |
| Already-trimmed ID | 51 | Same as above |
| Mixed valid + invalid IDs | 51 | Same — entire call fails, no trims applied |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TrimDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Draw intersecting geometry
const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

// Step 1: Split at intersections
const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
// splitIds = [Circle_part0, Circle_part1, Line_part0, Line_part1, Line_part2]

// Step 2: Trim unwanted segments (upper arc + middle line)
await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], splitIds[3]] })

// Step 3: Apply trims to actual geometry
await api.v1.sketch.splitCurvesMergeBack({ id: skId })
// Result: bottom arc + left line + right line (new IDs)
```

## Related

- `sketch.splitAllCurves` — step 1 of the trim workflow (creates sub-curves)
- `sketch.splitCurves` — manual splitting at specific parameter positions
- `sketch.splitCurvesMergeBack` — step 3 of the trim workflow (applies trims)
- `sketch.deleteObject` — alternative for removing entire curves (no split needed)
