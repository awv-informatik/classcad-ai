# part.mirror

Creates a mirror feature that reflects one or more target features across a work plane, producing mirrored copies as separate bodies.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- A work plane to mirror across — built-in (`Top`, `Front`, `Right`) or custom (`part.workPlane`)

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to mirror. Accepts two formats:
  - Flat IDs: `[featureId1, featureId2]`
  - Object format: `[{ id: featureId, indices: [0, 2] }]` — `indices` selects specific solids when a feature has multiple (e.g., from a pattern)
- `references` — array containing **one work plane ID**. This is the mirror plane.
- `name` — feature name (default `"Mirror"`)

## Return Value

Feature ID (numeric) on success, with maxLevel=31 (info). Empty messages array. Returns null on failure (maxLevel=51).

## Gotchas

- **`references` accepts work planes and planar brep faces** (face id from `getGeometryIds({ planes: [...] })`). Error 1006 means the id is invalid (e.g. stale), not the wrong kind.
- **Mirror creates separate bodies, never merges.** Even when mirrored geometry overlaps the original, the result is independent bodies that coexist.
- **Empty `references: []` creates a degenerate feature.** Returns a feature ID but maxLevel=51 — the feature exists in the tree with no valid geometry. Always check `maxLevel >= 51`.
- **Chain mirrors work.** You can mirror a mirror feature to create multi-axis symmetry (e.g., mirror across X, then mirror that across Y = 4 copies).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1006 | "An element of parameter 'references' has an invalid id!" | Invalid or stale ID in references | Re-query the plane/face id |
| 1006 | "An element of parameter 'targets' has an invalid id!" | Invalid feature ID in targets | Verify feature IDs |
| 1004 | '"targets" must be provided in the api call!' | Missing targets param | Pass `targets: [featureId]` |
| 1004 | "The type '0' is not supported in PrepareAPIParams!" | Empty targets array `[]` | Provide at least one target |
| 1111 | "There is no reference found for Mirror (CC_Mirror)." | Empty references array `[]` | Provide a work plane ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MirrorDemo' })).result

// Create offset geometry
const wcs = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  offset: [20, 0, 0],
})).result
const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  length: 30, width: 25, height: 40,
  references: [wcs],
})).result

// Mirror across built-in Right (YZ) plane
const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
const mirrorId = (await api.v1.part.mirror({
  id: partId,
  name: 'MirrorX',
  targets: [boxId],
  references: [rightWp],
})).result

// Chain: mirror the first mirror across Front (XZ) for 4-copy symmetry
const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const mirror2 = (await api.v1.part.mirror({
  id: partId,
  name: 'MirrorY',
  targets: [mirrorId],
  references: [frontWp],
})).result
```

## Related

`part.updateMirror` · `part.getWorkGeometry` · `part.workPlane` · `part.linearPattern` · `part.circularPattern`
