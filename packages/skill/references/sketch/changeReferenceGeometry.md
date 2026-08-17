# sketch.changeReferenceGeometry

Re-links existing "Use" geometry in a sketch to a different brep element. The sketch geometry **moves** to match the new reference's projected position.

## Prerequisites

- A sketch with projected reference geometry (from `sketch.referenceGeometry`)
- A new brep element ID to relink to (from `part.getGeometryIds`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — ID of the sketch geometry to relink (returned by `referenceGeometry`)
- **`refId`** (required) — ID of the new brep element (edge or vertex)

## Return Value

```js
{ result: VOID, messages?: [...], maxLevel?: real }
```

Returns VOID (null). maxLevel=31 on success.

## Behavior

- **Geometry moves** to match the new reference. Example: a line projected from the front edge (y=0) relinks to the back edge → line moves to y=60.
- **Works on unreferenced geometry** too — if the geometry was created with `keepReference: FALSE`, `changeReferenceGeometry` can add a reference to it.
- **Works after `unlinkReferenceGeometry`** — can re-establish a link that was previously disconnected.

## Working Example

```js
// Project front edge, then relink to back edge
const r = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [frontEdge] })
const lineId = r.result[0]
// lineId is at y=0 (front edge)

await api.v1.sketch.changeReferenceGeometry({ id: skId, geomId: lineId, refId: backEdge })
// lineId now at y=60 (back edge position)
```

## Related

- `sketch.referenceGeometry` — create the reference geometry in the first place
- `sketch.unlinkReferenceGeometry` — disconnect the link (reverse operation)
