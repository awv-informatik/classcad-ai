# part.compositeCurve

Creates a composite curve feature that joins multiple curves/edges into a single continuous path in the feature tree.

## Prerequisites

- A part (`part.create`)
- Sketch curves (from a sketch) or brep edges (from a solid feature), or face-plane IDs

## Key Parameters

- `id` — part ID (required)
- `references` — array of curve/edge/face IDs to combine. Accepted types: `sketch-curve`, `edge-line`, `edge-arc`, `edge-circle`, `edge-nurbs`, `face-plane`
- `name` — optional, defaults to `"CompositeCurve"`

## Return Value

Returns the composite curve feature ID. Feature class: `CC_CompositeCurve`.

## Accepted Reference Types

The error message from invalid references reveals the full list:
- `sketch-curve` — sketch line, arc, circle IDs
- `edge-line`, `edge-arc`, `edge-circle`, `edge-nurbs` — brep edge IDs (from `getGeometryIds`)
- `face-plane` — a planar face ID; extracts the face's boundary loop as the composite curve

## Gotchas

- **Empty references** creates the feature but in a broken state with error code 1111: "There are missing references". Avoid passing `references: []`.
- **Face + edge mixing** can fail with code 1121 ("more than two lines/edges meet each other") when the added edge shares a vertex with the face boundary, creating an ambiguous junction.
- **Non-contiguous curves** are accepted without error or warning — gaps between curves don't trigger any message.
- **Single curve** works — you can create a composite curve from just one reference.
- **Shared references** — the same sketch curve can belong to multiple composite curves.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1006 | "An element of parameter 'references' has an invalid id!" | Bogus/non-existent ID |
| 1001 | "The parameter 'references' has a wrong id type!" | Wrong object type (e.g., part ID) |
| 1111 | "There are missing references for ... (CC_CompositeCurve)." | Empty references array |
| 1121 | "more than two lines/edges meet each other" | Ambiguous junction — too many edges at one vertex |
| 1200 | "The provided feature is not allowed to update. It's not active and open." | `updateCompositeCurve` called without `openFeature` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.part.sketch({ id: partId, name: 'Path' })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })).result

const ccId = (await api.v1.part.compositeCurve({
  id: partId,
  name: 'SweepPath',
  references: [l1, l2],
})).result
```

## Updating

Requires `openFeature` → `updateCompositeCurve` → `closeFeature`. Can update `references`, `name`, or both. Omitting a parameter keeps the existing value.

```js
await api.v1.part.openFeature({ id: ccId })
await api.v1.part.updateCompositeCurve({ id: ccId, references: [l1, l2, l3] })
await api.v1.part.closeFeature({ id: ccId })
```

## Related

- `part.updateCompositeCurve` — modify after creation
- `part.openFeature` / `part.closeFeature` — required gate for updates
- `part.getGeometryIds` — find brep edge/face IDs for references
