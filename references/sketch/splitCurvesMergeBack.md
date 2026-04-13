# sketch.splitCurvesMergeBack

Commits staged split results from `splitAllCurves` into real sketch geometry. This is **step 3** of the trim workflow: `splitAllCurves → trimCurves → splitCurvesMergeBack`.

Without mergeBack, trims are invisible — the original curves stay rendered until this call applies the changes.

## Prerequisites

- A sketch (`sketch.create`)
- `splitAllCurves` must have been called first (otherwise mergeBack is a no-op)

## Key Parameters

- `id` — sketch ID (required). Must be a sketch ID, not a part ID.

That's it — no other parameters. No options, no configuration.

## Return Value

Always VOID (null). maxLevel=31 on success. No useful return data.

## What mergeBack Does

### With trimmed segments
Curves that had segments removed by `trimCurves`:
- Original curve is destroyed
- Remaining segments become new curves with **new IDs**
- Circles become arcs if a segment was removed
- Two remaining segments of a line become two separate line entities

### Without trimmed segments
Curves that were split but had NO segments trimmed:
- **Reconstructed to their originals with the same ID**
- The split is effectively undone for that curve
- `splitAllCurves → mergeBack` (no trim) is a complete round-trip no-op

### Non-intersecting curves
Curves in the `NoneSplitted` container (returned by `splitAllCurves` with their original IDs):
- If NOT trimmed: keep original ID, unchanged
- If trimmed (via original ID): **deleted entirely** after mergeBack

### Points
Sketch points are completely unaffected by the entire split/trim/merge workflow. They keep their IDs.

## ID Preservation Rules

| Scenario | After mergeBack |
|---|---|
| Curve split, no segments trimmed | **Same ID** — original reconstructed |
| Curve split, some segments trimmed | **New IDs** — remaining segments get new IDs |
| Curve split, all segments trimmed | **Deleted** — curve gone |
| Non-intersecting curve, not trimmed | **Same ID** — unchanged |
| Non-intersecting curve, trimmed | **Deleted** — curve gone |
| Points | **Same ID** — always unaffected |

## When mergeBack is a No-Op

All of these are safe — return VOID/null, maxLevel=31, no error:
- No prior `splitAllCurves` call
- After `splitCurves` (manual split — different system, no staged state)
- `splitAllCurves → mergeBack` with no `trimCurves` in between
- Calling mergeBack twice in a row (second call is harmless)
- Empty sketch
- Single curve with no intersections

## Repeated Cycles

You can split and merge the same sketch repeatedly:
```
splitAllCurves → mergeBack → splitAllCurves → mergeBack → ...
```
Each cycle gets fresh split IDs. No state accumulates between cycles.

## Gotchas

- **No return data.** Unlike `splitAllCurves` (which returns segment IDs), mergeBack returns nothing. You must call `getGeometry` afterward to discover the new IDs.
- **All old IDs for trimmed curves are invalid after mergeBack.** Don't cache IDs across the trim workflow.
- **Untrimmed curves keep their IDs.** Only curves that had segments removed get new IDs. This means you can safely reference untouched geometry after mergeBack.
- **splitAllCurves segment ordering follows creation order.** The first-created curve's segments appear first in the array. This matters when selecting indices for `trimCurves`.
- **Only works with splitAllCurves.** Has no effect after `splitCurves` (manual parametric splitting).

## Common Errors

| Scenario | maxLevel | Code | Message |
|---|---|---|---|
| Wrong ID type (e.g., part ID) | 51 | 1001 | "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" |
| Invalid/nonexistent ID | 51 | 1006 | "An element of parameter \"id\" has an invalid id!" |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TrimDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Draw intersecting geometry
const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

// Step 1: Split at intersections
const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
// splitIds ordered by creation: circle segments first, then line segments

// Step 2: Trim unwanted segments
await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0]] })

// Step 3: Apply trims
await api.v1.sketch.splitCurvesMergeBack({ id: skId })

// Discover new geometry
const geom = await api.v1.sketch.getGeometry({ id: skId })
// geom.result.arcs = [newArcId]  — remaining circle arc (new ID)
// geom.result.lines = [lineId]   — original line (same ID, untrimmed)
```

## Related

- `sketch.splitAllCurves` — step 1: splits curves at intersection points (staged)
- `sketch.trimCurves` — step 2: removes unwanted sub-curves (staged)
- `sketch.splitCurves` — manual parametric splitting (NOT compatible with mergeBack)
- `sketch.getGeometry` — query geometry IDs after mergeBack to discover new IDs
- `sketch.deleteObject` — alternative for removing curves without the split workflow
