# sketch.splitAllCurves

Splits all curves in a sketch at their intersection points. This is **step 1** of the trim workflow: `splitAllCurves → trimCurves → splitCurvesMergeBack`.

Does not modify visible geometry. It creates an internal `SplittedCurves` container with sub-curve segments and a `NoneSplitted` container for curves that have no intersections. The original curves remain in the sketch until `splitCurvesMergeBack` is called.

## Prerequisites

- A sketch (`sketch.create`)
- At least one curve in the sketch (lines, circles, arcs). Works on empty sketches too (returns `[]`).

## Key Parameters

- `id` — sketch ID (required). Must be a sketch ID, not a part ID.

## Return Value

`Array<id>` — flat array of all sub-curve IDs (split segments + unsplit originals).

- **Intersecting curves** → split into `{OriginalName}_part{N}` segments (CC_Arc for circles/arcs, CC_Line for lines). These go into a `SplittedCurves` container.
- **Non-intersecting curves** → returned with their **original IDs** unchanged. These go into a `NoneSplitted` container.
- **Points** are excluded. Only curves appear in the result.
- **Empty sketch** → returns `[]` with maxLevel=31.

Result ordering is **deterministic**: segments are grouped by original curve in creation order, then by part number (`_part0`, `_part1`, ...) within each curve.

## Segment Naming Convention

Segments are named `{OriginalCurveName}_part{N}` where N starts at 0:
- Circle → `Circle_part0` (CC_Arc), `Circle_part1` (CC_Arc)
- Line → `Line_part0` (CC_Line), `Line_part1` (CC_Line), `Line_part2` (CC_Line)

For multiple curves of the same type, names get a numeric suffix: `Line_partN`, `Line0_partN`, `Line1_partN`, etc. Non-split curves keep their original names (e.g., `Line0`, `Rect_Line2`).

## Structure Tree After Split

Two containers are created under the sketch geometry:
- **`SplittedCurves`** (CC_Container) — holds all split sub-curve segments
- **`NoneSplitted`** (CC_Container) — holds curves that had no intersections (original IDs)

## Intersection Behavior

| Scenario | Behavior |
|---|---|
| **Two curves crossing** | Both split at intersection points |
| **Tangent contact** (line tangent to circle) | Line split at tangent point; circle NOT split |
| **T-junction** (endpoint touches midpoint) | Continuous curve split at contact; terminating curve stays whole |
| **Collinear overlapping lines** | Both lines split at overlap boundary points |
| **Multiple curves at same point** | Each curve split once at the common crossing point (no extra segments) |
| **Non-intersecting curves** | Returned with original IDs |
| **Single curve** | Returned with original ID |
| **Empty sketch** | Returns `[]` |

## Gotchas

- **Tangent and T-junction splits are asymmetric.** The curve whose interior is touched gets split. The curve that terminates at or is tangent to the contact point does NOT get split. This matters when selecting segments for trimming.
- **Calling twice without mergeBack is safe.** The second call re-creates the split containers with new IDs. No error, no accumulation.
- **Points are not included.** `sketch.point` entities are completely ignored by splitAllCurves.
- **Rectangle sides split independently.** A `sketch.rectangle` creates 4 individual lines. Only sides that intersect other curves get split; the rest keep original IDs.
- **All IDs in the result are valid for `trimCurves`.** Both split segment IDs and original (unsplit) curve IDs can be passed to `trimCurves({ curveIds: [...] })`. Trimming an unsplit curve removes it entirely after mergeBack.

## Common Errors

| Scenario | maxLevel | Code | Message |
|---|---|---|---|
| Wrong ID type (e.g., part ID) | 51 | 1001 | "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" |
| Invalid/nonexistent ID | 51 | 1006 | "An element of parameter \"id\" has an invalid id!" |

On error, result is `null`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SplitDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Draw intersecting geometry
const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

// Split at all intersections
const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
// splitIds = [Circle_part0, Circle_part1, Line_part0, Line_part1, Line_part2]
// 5 segments: 2 arcs from circle + 3 line segments

// Now use splitIds with trimCurves to remove unwanted segments
// Then call splitCurvesMergeBack to apply
```

## Related

- `sketch.trimCurves` — step 2: remove unwanted sub-curves by ID
- `sketch.splitCurvesMergeBack` — step 3: apply trims to actual geometry
- `sketch.splitCurves` — manual splitting at specific parameter positions (not intersection-based)
- `sketch.deleteObject` — alternative for removing entire curves without the split workflow
