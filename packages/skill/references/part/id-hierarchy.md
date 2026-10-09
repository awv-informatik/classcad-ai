# Entity Injection ID Hierarchy

How the `id` parameter maps across `part.*`, `solid.*`, and `curve.*` APIs. Getting this wrong is the #1 source of error 1001.

## The Chain

```
Part (part.create → partId)
├─ part.* features (box, extrusion, sketch, etc.) ← id: partId
│
└─ Entity Injection (part.entityInjection → eifId)
   ├─ solid.* (box, cylinder, subtraction, etc.) ← id: eifId
   │   └─ Returns solid feature IDs
   │
   └─ curve.shape (→ shapeId) ← id: eifId
       └─ curve.* (line, arc, circle, etc.) ← id: shapeId
           └─ Returns VOID (curves are not individually addressable)
```

| API Domain | `id` expects | Example |
|------------|----------------------|---------|
| `part.box`, `part.extrusion`, `part.entityInjection` | Part ID | `part.box({ id: partId, ... })` |
| `solid.box`, `solid.cylinder`, `solid.subtraction`, `solid.deleteSolid`, `solid.copy` | Entity Injection ID | `solid.box({ id: eifId, ... })` |
| `curve.shape` | Entity Injection ID | `curve.shape({ id: eifId, ... })` |
| `curve.line`, `curve.arc*`, `curve.circle`, `curve.bezierCurve`, etc. | Shape ID | `curve.line({ id: shapeId, ... })` |

## Wrong ID Type → Error 1001

ID types are strictly validated; the message names the expected type:

```
maxLevel: 51
message: 'The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]'
```

Common mistakes: part ID → `solid.box` (expects `["entityinjection"]`); EI ID → `curve.line` (expects `["shape"]`); shape ID → `solid.box` (expects `["entityinjection"]`); part ID → `curve.shape` (expects `["entityinjection"]`).

## Cross-EI References

- `solid.subtraction({ id: ei1, target: solidInEi1, tools: [solidInEi2] })` works — `id` is the EI the operation belongs to; `target`/`tools` can reference solids from any EI.
- `solid.copy({ id: ei2, target: solidFromEi1 })` works — copy created in `ei2`, source stays in `ei1`.

An EI can contain multiple solids and multiple shapes simultaneously.

## Two IDs Per Solid

1. **Feature-level ID** — returned by `solid.box()`, `solid.cylinder()`, etc.; lives in `EI.children`. Use it for all `solid.*` calls (`deleteSolid`, `copy`, boolean `target`/`tools`).
2. **Graphic container ID** — the `container.id` of each unconsumed body's graphic, listed in the part node's `solids` array (= `CC_Solid.geometryIdList[0]`). It is renumbered whenever the body is re-tessellated. `common.requestVisualisation` accepts it; `solid.*` calls don't — use the feature-level ID there.

## Curve IDs

`curve.line`, `curve.arc*`, `curve.circle`, etc. return **VOID** (null). Individual curves cannot be referenced, deleted, or modified after creation — the shape container is the smallest manipulable unit.

## part.box vs solid.box

| | `part.box` | `solid.box` |
|---|---|---|
| `id` param | Part ID | Entity Injection ID |
| Returns | Box feature ID | Solid feature ID |
| Model | Parametric feature (feature tree, update/delete) | Direct geometry (no feature history) |
| Update | `openFeature` → `updateBox` → `closeFeature` | No update API — delete and recreate |
| Use case | Parametric modeling | Direct/computational geometry |
