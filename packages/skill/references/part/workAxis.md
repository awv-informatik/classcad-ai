# part.workAxis

Creates a work axis feature — an invisible construction line used as a revolve axis, pattern direction, or positioning reference.

## Prerequisites

- A part (`part.create`)
- For referenced types (POINTDIRECTION, CURVE, 2POINTS, 2PLANES): brep geometry IDs from `part.getGeometryIds` or work geometry IDs

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — feature name, default `"WorkAxis"`. Duplicate names are allowed but `getWorkGeometry` only returns the first match. Use unique names.
- **`type`** — one of 5 types (default `"USERDEFINED"`):

| Type | References needed | Description |
|------|------------------|-------------|
| `USERDEFINED` | none | Free-standing axis defined by `position` and `direction` |
| `POINTDIRECTION` | 1 point + 1 direction | Point (brep-vertex, sketch-point, work-point) + direction (brep-edge, sketch-line, work-axis). Flexible — also accepts two edges. |
| `CURVE` | 1 edge | Axis follows the edge. Only accepts: sketch-arc, sketch-circle, edge-arc, edge-circle, edge-line. **Does NOT accept work axis IDs** despite what the docs imply. |
| `2POINTS` | 2 points | Two points (brep-vertex, sketch-point, work-point) define the axis. Same point twice → error. |
| `2PLANES` | 2 planes | Two planes (brep-face, work-plane) — axis is at their intersection. Parallel planes → error. |

- **`references`** — array of brep or work geometry IDs. Not needed for USERDEFINED. Mixed brep + work geometry refs are valid.
- **`position`** — `[x,y,z]` numeric array, USERDEFINED only. Default `[0,0,0]`. **Does NOT accept expression strings** — numbers only.
- **`direction`** — `[x,y,z]` numeric array, USERDEFINED only. Default `[1,0,0]` (X-axis). Does not need to be normalized. **Zero vector `[0,0,0]` is accepted silently** — creates a degenerate axis with no error.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the feature ID of the created work axis. Use this ID as:
- `axisIds` element in `part.revolve` — revolve axis
- `dir1.references` or `dir2.references` in `part.linearPattern` — pattern direction
- `references` element in `part.translation` — translation direction
- Reference for other work geometry

## Built-in Work Axes

Every part has 3 built-in work axes (created automatically by `part.create`):

| Name | Direction | Description |
|------|-----------|-------------|
| `XAxis` | `[1,0,0]` | X-axis |
| `YAxis` | `[0,1,0]` | Y-axis |
| `ZAxis` | `[0,0,1]` | Z-axis |

Access via `getWorkGeometry({ id: partId, name: 'XAxis' })`. Use these for revolve/pattern operations instead of creating custom axes when the standard directions suffice.

## Gotchas

- **Zero direction is silently accepted** — `direction: [0,0,0]` creates a degenerate axis with no error or warning. Always pass a non-zero direction.
- **Expression strings don't work in position/direction arrays** — despite the `point | expression` type annotation, array elements must be numeric. `position: ['@expr.x', 0, 0]` fails with a type error.
- **CURVE type rejects work axis IDs** — the docs say "brep-edge, sketch-line or work-axis" but only sketch-arc, sketch-circle, edge-arc, edge-circle, edge-line are actually accepted. Work axis IDs are rejected.
- **POINTDIRECTION is flexible** — it accepted two edges (not strictly point + edge) without error.
- **Duplicate names are silently allowed** — no error, no warning. `getWorkGeometry` returns only the first match. Always use unique names.
- **updateWorkAxis requires openFeature/closeFeature** — without it, every update call fails with "not active and open".

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type string | Use exact string: USERDEFINED, POINTDIRECTION, CURVE, 2POINTS, 2PLANES |
| `"references" must be provided` | Non-USERDEFINED type without refs | Pass `references: [...]` |
| `"references" has invalid number of elements` | Wrong count for type | 2PLANES needs 2, CURVE needs 1, etc. |
| `"references" has a wrong id type` | Wrong geometry type for CURVE | Use edge-line, edge-arc, edge-circle, sketch-arc, sketch-circle only |
| `"Direction cant be a null vector"` | 2POINTS with same point twice | Use two distinct points |
| `"planes mustn't be parallel"` | 2PLANES with parallel planes | Use non-parallel planes |
| `"not active and open"` | updateWorkAxis without openFeature | Wrap in openFeature/closeFeature |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Simple USERDEFINED: Y-axis at offset position
const waId = (await api.v1.part.workAxis({
  id: partId,
  name: 'PatternDir',
  position: [0, 0, 0],
  direction: [1, 0, 0]
})).result

// Use built-in axis (no creation needed)
const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

// Referenced: axis from two brep faces (intersection line)
const gids = await api.v1.part.getGeometryIds({
  id: partId,
  planes: [
    { positions: [[40, 30, 40]] },  // top face
    { positions: [[40, 0, 20]] },   // front face
  ]
})
const wa2 = (await api.v1.part.workAxis({
  id: partId,
  name: 'WA_intersection',
  type: '2PLANES',
  references: [gids.result.planes[0], gids.result.planes[1]]
})).result

// Use as linearPattern direction
await api.v1.part.linearPattern({
  id: partId,
  targets: [featureId],
  dir1: { references: [waId], distance: 50, count: 3 }
})

// Update: requires openFeature/closeFeature
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 1, 0] })
await api.v1.part.closeFeature({ id: waId })
```

## Related

- `part.updateWorkAxis` — modify after creation (requires openFeature/closeFeature)
- `part.getWorkGeometry` — find work axis by name (also finds built-in XAxis/YAxis/ZAxis)
- `part.revolve` — use work axis as revolve axis (`axisIds` param)
- `part.linearPattern` — use work axis as pattern direction (`dir1.references`)
- `part.workPlane`, `part.workPoint`, `part.workCSys` — other work geometry types
