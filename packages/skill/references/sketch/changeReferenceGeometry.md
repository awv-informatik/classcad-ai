# sketch.changeReferenceGeometry

Re-links existing "Use" geometry (from `sketch.referenceGeometry`) to a different brep element. The sketch geometry **moves** to the new reference's projected position.

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — sketch geometry to relink (returned by `referenceGeometry`)
- **`refId`** (required) — new brep element (edge or vertex, from `part.getGeometryIds`)

## Return Value

VOID (null), maxLevel=31 on success.

## Behavior

- **Geometry moves** to the new reference: a line projected from the front edge (y=0) relinked to the back edge moves to y=60.
- **Works on unreferenced geometry** — adds a reference to geometry created with `keepReference: FALSE`.
- **Works after `unlinkReferenceGeometry`** — re-establishes a disconnected link.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const { lines } = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }, { pos: [40, 60, 0] }] })).result

const lineId = (await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [lines[0]] })).result[0] // y=0
await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: lineId, refId: lines[1] }) // now y=60
```

## Related

`sketch.referenceGeometry` · `sketch.unlinkReferenceGeometry`
