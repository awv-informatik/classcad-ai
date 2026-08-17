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

## Which ID Goes Where

| API Domain | `id` parameter expects | Example |
|------------|----------------------|---------|
| `part.box`, `part.extrusion`, `part.entityInjection` | Part ID | `part.box({ id: partId, ... })` |
| `solid.box`, `solid.cylinder`, `solid.subtraction`, `solid.deleteSolid`, `solid.copy` | Entity Injection ID | `solid.box({ id: eifId, ... })` |
| `curve.shape` | Entity Injection ID | `curve.shape({ id: eifId, ... })` |
| `curve.line`, `curve.arc*`, `curve.circle`, `curve.bezierCurve`, etc. | Shape ID | `curve.line({ id: shapeId, ... })` |

## Wrong ID Type → Error 1001

The server strictly validates ID types. Passing the wrong type always produces error 1001 with a descriptive message:

```
maxLevel: 51
message: 'The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]'
```

The error tells you exactly what type is expected. Common mistakes:
- Passing part ID to `solid.box` → expects `["entityinjection"]`
- Passing EI ID to `curve.line` → expects `["shape"]`
- Passing shape ID to `solid.box` → expects `["entityinjection"]`
- Passing part ID to `curve.shape` → expects `["entityinjection"]`

## Cross-EI References

Boolean and copy operations work across entity injection boundaries:

- `solid.subtraction({ id: ei1, target: solidInEi1, tools: [solidInEi2] })` — works. `id` is the EI the operation belongs to, but `target`/`tools` can reference solids from any EI.
- `solid.copy({ id: ei2, target: solidFromEi1 })` — works. The copy is created in `ei2`, the source solid stays in `ei1`.

## Two IDs Per Solid

Each solid in an EI has two distinct IDs:

1. **Feature-level ID** — returned by `solid.box()`, `solid.cylinder()`, etc. Lives in `EI.children` in the structure tree. This is the ID you use for all `solid.*` API calls (`deleteSolid`, `copy`, boolean `target`/`tools`).
2. **Geometry-level ID** — lives in `part.solids` array and inside `CC_Solid.geometryIdList`. This is an internal reference, not what the API returns.

Always use the feature-level ID (from the API return value). Do not use geometry-level IDs from `part.solids`.

## Curve IDs

Curve creation APIs (`curve.line`, `curve.arc*`, `curve.circle`, etc.) return **VOID** (null). Individual curves are not addressable by ID after creation — you cannot reference, delete, or modify a specific curve. The shape container is the smallest unit you can manipulate.

## part.box vs solid.box

These are entirely different APIs despite the shared name:

| | `part.box` | `solid.box` |
|---|---|---|
| `id` param | Part ID | Entity Injection ID |
| Returns | Box feature ID | Solid feature ID |
| Model | Parametric feature (feature tree, update/delete) | Direct geometry (no feature history) |
| Update | `openFeature` → `updateBox` → `closeFeature` | No update API — delete and recreate |
| Use case | Parametric modeling | Direct/computational geometry |

## Coexistence

An entity injection can contain both solids and shapes simultaneously. Multiple solids and multiple shapes can coexist in a single EI.
