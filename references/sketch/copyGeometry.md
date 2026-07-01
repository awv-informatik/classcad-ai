# sketch.copyGeometry

Copies sketch geometry elements within the same sketch, offset by a translation vector.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)
- At least one geometry element in the sketch to copy

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomIds`** (required) — array of geometry IDs to copy. Accepts lines, circles, arcs, points, and mixed types. (See Return Value for how many ids come back — it depends on `doCopyConstraints`.)
- **`translation`** (required) — `[x, y, z]` offset vector. **This is not optional** — omitting it produces error 1004. `[0, 0, 0]` is valid (copies on top of original).
- **`doCopyConstraints`** (optional, default TRUE) — whether to copy constraints from the original elements.

## Return Value

`result` is `id[]` — the ids of the copied objects. **What lands in the array depends on `doCopyConstraints`:**

- `doCopyConstraints: false` → **one id per input geometry element**, in matching order (geometry only).
- `doCopyConstraints: true` (or omitted/default) → the copied geometry **plus the copied constraint objects**, so the array is **longer than the input count** (e.g. copying one auto-horizontal line returned 3 ids: the line copy + its duplicated constraints). Geometry copies come first, then constraint copies.

Child points (a line's endpoints, a circle's center) are copied and translated but are **not** listed in `result` — they're sub-members of the returned geometry.

Every response also carries `structure` (the full tree) and `graphic`.

> **Version note:** older/unpatched ClassCAD returned `result: null` whenever `doCopyConstraints` was true (the default) — the copy succeeded but no ids came back, so you had to pass `doCopyConstraints: false` (or diff `getGeometry`) to recover them. Root cause: a missing return in `SketcherHelper.CopyObjects` (it returned `copies` only on the `false` branch and fell through to a bare `RETURN;` otherwise). Fixed so every path returns the ids. **If you get `null` on a `true` copy, you're on a pre-fix build** — fall back to `doCopyConstraints: false`.

## What gets copied (verified 2026-07-01)

- **Geometry + child points.** Copying a line copies its 2 endpoints; copying a circle copies its center point — all translated by the vector. Child points get fresh IDs but are **not** listed in `result` (they're sub-members of the copied geometry). (Verified: copy a circle centered `[5,5]` by `[80,0,0]` → the copy's center reads back `[85,5,0]`.)
- **`doCopyConstraints: true` (default) → geometric constraints are duplicated** among the copied set. Copying two perpendicular joined lines added +7 constraint nodes (the coincident join, the perpendicular, and the auto H/V for each copy). The **constraint part of a dimension also duplicates** (a `RADIUS` dimension's `CC_2DRadiusConstraint` went 1→2), so copies stay size/shape-locked — but the **driving feature-dimension annotation does NOT** duplicate (`CC_RadialFeatureDimension` stayed 1). Net: copies are constrained but not re-annotated.
- **`doCopyConstraints: false` → bare geometry only.** No constraints are attached to the copies — not even the auto H/V that fresh axis-aligned geometry normally gets. Use this when you want independent, unconstrained duplicates (and when you need the returned IDs).

## Gotchas

- `translation` is required despite no `[param.translation]` bracket marking in the source docs. Omitting it → error 1004.
- Empty `geomIds: []` is a silent no-op — null result, maxLevel 31, no messages, no error.
- Invalid IDs in geomIds → error 1006: "An element of parameter \"geomIds\" has an invalid id!"
- Null values in geomIds → error 1001: type mismatch. Always filter nulls before passing.
- `doCopyConstraints` copies the geometric constraints among the copied set (default `true`) — it does **not** change the return type: both `true` and `false` return `id[]`. (Pre-fix builds wrongly returned `null` on `true` — see the Version note.)

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | "The parameter \"translation\" must be provided" | Missing `translation` param |
| 1006 | "An element of parameter \"geomIds\" has an invalid id!" | Non-existent ID in geomIds |
| 1001 | "An element of parameter \"geomIds\" has the wrong type!" | Null or non-id value in geomIds |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result

// doCopyConstraints:false → exactly one id per input element (bare geometry, no constraints)
const r = await api.v1.sketch.copyGeometry({
  id: skId,
  geomIds: [line],
  translation: [0, 30, 0],
  doCopyConstraints: false
})
// r.result → [67] — one new ID per input element
```

```js
// Copy rectangle (4 lines) with the default (constraints copied too)
const rectLines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
const r2 = await api.v1.sketch.copyGeometry({
  id: skId,
  geomIds: rectLines,
  translation: [60, 0, 0]
})
// r2.result → id[] with the 4 line copies PLUS the duplicated constraints (longer than 4)
// (pre-fix builds returned null here — see the Version note)
```

## Related

- `sketch.copyFrom` — copies geometry between different sketches
- `sketch.moveGeometry` — moves instead of copying
- `sketch.linearPattern` / `sketch.circularPattern` / `sketch.mirrorPattern` — patterned copies
