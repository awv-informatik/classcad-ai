# sketch.unlinkReferenceGeometry

Disconnects "Use" geometry (from `sketch.referenceGeometry`) from its brep reference. The geometry **stays** at its current position but no longer updates when the solid changes.

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — sketch geometry to unlink. VOID/null → error 1001.

## Return Value

VOID (null), maxLevel=31 on success.

## Behavior

- **Geometry persists and is frozen** — it does not disappear or revert; solid changes no longer affect it.
- **Idempotent** — unlinking already-unlinked geometry is a silent no-op (maxLevel=31).
- **Reversible** with `changeReferenceGeometry`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const { lines } = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }, { pos: [40, 60, 0] }] })).result
const lineId = (await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [lines[0]] })).result[0]

await api.v1.sketch.unlinkReferenceGeometry({ id: skId, geomId: lineId }) // frozen
await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: lineId, refId: lines[1] }) // re-link later
```

## Related

`sketch.referenceGeometry` · `sketch.changeReferenceGeometry`
