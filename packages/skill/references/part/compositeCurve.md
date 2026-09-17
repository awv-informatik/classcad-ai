# part.compositeCurve

Creates a composite curve feature (`CC_CompositeCurve`) joining multiple curves/edges into one path in the feature tree.

## Key Parameters

- `id` — part ID (required)
- `references` — IDs to combine. Accepted types (per the invalid-type error message):
  - `sketch-curve` — sketch line, arc, circle
  - `edge-line`, `edge-arc`, `edge-circle`, `edge-nurbs` — brep edges (from `getGeometryIds`)
  - `face-plane` — planar face; its boundary loop becomes the composite curve
- `name` — default `"CompositeCurve"`

## Return Value

The composite curve feature ID.

## Gotchas

- **Empty `references: []`** creates the feature in a broken state (error 1111 "There are missing references").
- **Face + edge mixing** can fail with 1121 ("more than two lines/edges meet each other") when the edge shares a vertex with the face boundary (ambiguous junction).
- **Non-contiguous curves** are accepted silently — gaps trigger no message.
- A single curve works; the same sketch curve can belong to multiple composite curves.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1006 | "An element of parameter 'references' has an invalid id!" | Bogus/non-existent ID |
| 1001 | "The parameter 'references' has a wrong id type!" | Wrong object type (e.g. part ID) |
| 1111 | "There are missing references for ... (CC_CompositeCurve)." | Empty references array |
| 1121 | "more than two lines/edges meet each other" | Too many edges at one vertex |
| 1200 | "The provided feature is not allowed to update. It's not active and open." | `updateCompositeCurve` without `openFeature` |

## Updating

`openFeature` → `updateCompositeCurve` (`references`, `name`, or both; omitted params keep values) → `closeFeature`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.part.sketch({ id: partId, name: 'Path' })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })).result
const l3 = (await api.v1.sketch.line({ id: skId, startPos: [50, 40, 0], endPos: [0, 40, 0] })).result

const ccId = (await api.v1.part.compositeCurve({ id: partId, name: 'SweepPath', references: [l1, l2] })).result

await api.v1.part.openFeature({ id: ccId })
await api.v1.part.updateCompositeCurve({ id: ccId, references: [l1, l2, l3] })
await api.v1.part.closeFeature({ id: ccId })
```

## Related

`part.updateCompositeCurve` · `part.openFeature` / `part.closeFeature` · `part.getGeometryIds`
