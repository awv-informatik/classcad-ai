# sketch.unlinkReferenceGeometry

Disconnects "Use" geometry in a sketch from its brep reference. The sketch geometry **remains** at its current position but no longer updates when the solid changes.

## Prerequisites

- A sketch with projected reference geometry (from `sketch.referenceGeometry`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — ID of the sketch geometry to unlink

## Return Value

```js
{ result: VOID, messages?: [...], maxLevel?: real }
```

Returns VOID (null). maxLevel=31 on success.

## Behavior

- **Geometry persists.** The sketch geometry stays at its current position — it does not disappear or revert.
- **Position is frozen.** After unlinking, changing the referenced solid has no effect on the geometry.
- **Idempotent.** Calling `unlinkReferenceGeometry` on already-unlinked geometry is a silent no-op (maxLevel=31, no error).
- **Can be reversed** with `changeReferenceGeometry` — re-establishes a link to a brep element.
- **Requires a valid geomId.** Passing VOID/null gives error code 1001.

## Working Example

```js
// Project edge, then unlink
const r = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId] })
const lineId = r.result[0]

await api.v1.sketch.unlinkReferenceGeometry({ id: skId, geomId: lineId })
// lineId still exists in sketch, but frozen — solid changes won't affect it

// Can re-link later:
await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: lineId, refId: otherEdge })
```

## Related

- `sketch.referenceGeometry` — create the reference geometry
- `sketch.changeReferenceGeometry` — relink to a different brep element (can also re-establish after unlink)
