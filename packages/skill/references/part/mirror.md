# part.mirror

Creates a mirror feature that reflects target features across a plane, producing mirrored copies as separate bodies.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — feature IDs: flat `[featureId1, featureId2]` or `[{ id: featureId, indices: [0, 2] }]` (`indices` selects solids of a multi-solid feature, e.g. a pattern)
- `references` — **one** mirror plane: work plane (built-in `Top`/`Front`/`Right` or `part.workPlane`) or planar brep face (from `getGeometryIds({ planes: [...] })`)
- `name` — default `"Mirror"`

## Return Value

Feature ID (numeric), maxLevel=31, empty messages array. null on failure (maxLevel=51).

## Gotchas

- **Error 1006 on `references`** means the id is invalid (e.g. stale), not the wrong kind.
- **Never merges.** Even overlapping mirrored geometry stays an independent body.
- **Empty `references: []` creates a degenerate feature** — returns a feature ID but maxLevel=51; the feature exists with no valid geometry. Always check `maxLevel >= 51`.
- **Chained mirrors work** — mirror across X, then mirror that feature across Y = 4 copies.

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
const wcs = (await api.v1.part.workCSys({ id: partId, name: 'WCS1', offset: [20, 0, 0] })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 30, width: 25, height: 40, references: [wcs] })).result

// Mirror across built-in Right (YZ)
const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
const mirrorId = (await api.v1.part.mirror({ id: partId, name: 'MirrorX', targets: [boxId], references: [rightWp] })).result

// Chain across Front (XZ) → 4-copy symmetry
const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const mirror2 = (await api.v1.part.mirror({ id: partId, name: 'MirrorY', targets: [mirrorId], references: [frontWp] })).result
```

## Related

`part.updateMirror` · `part.getWorkGeometry` · `part.workPlane` · `part.linearPattern` · `part.circularPattern`
