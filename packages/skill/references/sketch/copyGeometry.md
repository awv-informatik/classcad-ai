# sketch.copyGeometry

Copies sketch geometry within the same sketch, offset by a translation vector.

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomIds`** (required) — lines, circles, arcs, points, mixed
- **`translation`** (required, despite no bracket marking in API docs) — `[x, y, z]`; omitted → 1004. `[0, 0, 0]` copies on top.
- **`doCopyConstraints`** (optional, default TRUE)

## Return Value

`id[]` in both modes (plus `structure` and `graphic` on every response):

- `doCopyConstraints: false` → **one id per input element**, in order (geometry only)
- `true`/default → geometry copies first, then **copied constraint objects** — longer than the input (one auto-horizontal line returned 3 ids)

Child points (line endpoints, circle center) are copied and translated with fresh IDs but **not listed** (circle at `[5,5]` copied by `[80,0,0]` → copy's center reads `[85,5,0]`).

## What gets copied

- **`true`: geometric constraints among the copied set are duplicated** — two perpendicular joined lines added +7 constraint nodes (coincident join, perpendicular, auto H/V per copy). A dimension's **constraint part duplicates** (`CC_2DRadiusConstraint` 1→2) so copies stay size/shape-locked, but the **feature-dimension annotation does NOT** (`CC_RadialFeatureDimension` stayed 1): constrained, not re-annotated.
- **`false`: bare geometry** — no constraints at all, not even the auto H/V fresh axis-aligned geometry normally gets. Use for independent duplicates and predictable returned IDs.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | "The parameter \"translation\" must be provided" | Missing `translation` |
| 1006 | "An element of parameter \"geomIds\" has an invalid id!" | Nonexistent ID |
| 1001 | "An element of parameter \"geomIds\" has the wrong type!" | Null/non-id value — filter nulls first |

Empty `geomIds: []` is a silent no-op (null, maxLevel 31).

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result

const r = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [line], translation: [0, 30, 0], doCopyConstraints: false })
// r.result → [67], one id per input

const rectLines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 60, 0], endPos: [40, 90, 0] })).result
const r2 = await api.v1.sketch.copyGeometry({ id: skId, geomIds: rectLines, translation: [60, 0, 0] })
// r2.result → 4 line copies PLUS duplicated constraints
```

## Related

`sketch.copyFrom` · `sketch.moveGeometry` · `sketch.linearPattern` / `sketch.circularPattern` / `sketch.mirrorPattern`
