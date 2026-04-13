# sketch.splitCurves

Splits curves at specific parameterized positions. Unlike `splitAllCurves` (which splits at intersection points and stages the result), `splitCurves` is an **immediate, permanent operation** — the original curve is destroyed and replaced by segments right away.

## Prerequisites

- A sketch (`sketch.create`)
- At least one curve (line, arc, circle) in the sketch

## Key Parameters

- `id` — sketch ID (required). Must be a sketch, not a part.
- `splits` — array of split specifications, each with:
  - `geomId` — curve ID to split. Must be a `sketch-curve` type (lines, arcs, circles). Points are rejected.
  - `values` — array of parameter positions in `[0, 1]` range. Position 0 = curve start, 1 = curve end. For circles, maps to `[0, 2*PI]`.

## Return Value

`Array<Array<id>>` — one inner array per `splits` entry.

- **Open curves** (lines, arcs): N split values → **N+1 segments**
- **Closed curves** (circles): N split values → **N segments** (not N+1 — the docs are wrong about this)
- **Circles with 1 split value** → returns **VOID** (cannot split a circle with a single cut)
- **Empty `splits` array** → returns `[]`
- **Empty `values` array** → returns `[[originalId]]` (original curve ID, no actual split)

## Naming Convention

Segments are named `Split_{OriginalName}`, `Split_{OriginalName}0`, `Split_{OriginalName}1`, etc.:
- First segment: `Split_Line`
- Second segment: `Split_Line0`
- Third segment: `Split_Line1`

A `Split_Coinc` (CC_2DCoincidentConstraint) is auto-created at each split point.

## Critical Differences from splitAllCurves

| | `splitCurves` | `splitAllCurves` |
|---|---|---|
| **Trigger** | Manual parameter positions | Automatic intersection detection |
| **Effect** | Immediate — original curve destroyed | Staged — creates SplittedCurves container |
| **mergeBack needed?** | No — split is permanent | Yes — to commit the split |
| **trimCurves compatible?** | **NO** — silent no-op | Yes — operates on SplittedCurves container |
| **Naming** | `Split_{Name}`, `Split_{Name}0` | `{Name}_part0`, `{Name}_part1` |

**`trimCurves` does NOT work on `splitCurves` results.** The IDs from `splitCurves` are real geometry, not staged in a container. Passing them to `trimCurves` is a silent no-op (maxLevel=31, no error, no effect). To remove a segment created by `splitCurves`, use `sketch.deleteObject` instead.

## Gotchas

- **Out-of-range values are silently accepted.** Values < 0 or > 1 extrapolate the curve beyond its endpoints, creating extended geometry. t=-0.5 on a 100-unit line extends 50 units before the start. **Always use values strictly within (0, 1) exclusive.**
- **Boundary values create degenerate segments.** Value 0.0 creates a zero-length segment at the start. Value 1.0 creates a zero-length segment at the end. Both succeed (maxLevel=31) but produce useless geometry.
- **splitCurvesMergeBack is a no-op after splitCurves.** The split is already committed — there's nothing to merge. mergeBack returns VOID with maxLevel=31.
- **Unsorted values are fine.** The API sorts them internally.
- **Circles need ≥2 split values.** A single split value on a circle returns VOID.
- **Cannot call part.create twice in one script.** The second part.create invalidates internal state and causes subsequent API calls to fail with "id = VOID" errors. One part.create per harness run.

## Common Errors

| Scenario | maxLevel | Message |
|---|---|---|
| Part ID instead of sketch ID | 51 | "wrong id type! Provide only following id types: [\"sketch\"]" |
| Invalid/nonexistent geomId | 51 | "ToId()/TOID() didn't get an existing or valid id." |
| Point ID as geomId | 51 | "wrong id type! Provide only following id types: [\"sketch-curve\"]" |
| 1 split on a circle | — | Returns VOID (null result) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SplitDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Draw a line
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

// Split at 1/3 and 2/3 positions → 3 segments
const r = await api.v1.sketch.splitCurves({
  id: skId,
  splits: [{ geomId: lineId, values: [0.33, 0.66] }]
})
// r.result = [[seg1Id, seg2Id, seg3Id]]
// Original lineId is now INVALID — replaced by the 3 segments

// To remove a segment, use deleteObject (NOT trimCurves)
await api.v1.sketch.deleteObject({ id: r.result[0][1] })
```

## Related

- `sketch.splitAllCurves` — intersection-based splitting (staged, works with trimCurves)
- `sketch.trimCurves` — removes segments from splitAllCurves (NOT compatible with splitCurves)
- `sketch.splitCurvesMergeBack` — commits splitAllCurves splits (no-op after splitCurves)
- `sketch.deleteObject` — use this to remove splitCurves segments
