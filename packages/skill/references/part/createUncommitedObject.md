# part.createUncommitedObject

Creates an empty, uncommitted feature shell (default member values, no geometry until committed) for two-phase creation: create the placeholder, then configure and commit. Usually call `part.box()` etc. directly — this is for interactive/UI flows showing a placeholder before the user confirms parameters, or reserving a position in the operation sequence before final parameters are known. The committed result is identical to direct creation.

## Key Parameters

All three are **required** — each produces a clear error when missing.

- `id` — part ID
- `type` — exact CC_ class name, case-sensitive (see [Valid Types](#valid-types))
- `name` — feature name; duplicates of existing feature names are allowed

## Return Value

`result`: the feature ID, usable with `openFeature`, the matching `update*`, and `closeFeature`.

## Commit vs Decline

The uncommitted feature must be committed or declined before any other feature can be created. Between `openFeature` and `closeFeature`: **any** `update*` call = commit (feature persists with geometry, findable by `getFeature`); no `update*` call = decline (feature removed from tree, ID becomes invalid).

```js
// Decline
const id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Temp' })).result
await api.v1.part.openFeature({ id })
await api.v1.part.closeFeature({ id })
```

`updateBox({})` with no dimension params is a valid no-op update that commits with default values (100x100x100 for a box).

## Gotchas

- **Singleton.** Only one uncommitted feature at a time. A second fails with: "There is still an uncommited feature called 'X', please commit or decline the feature first."
- **Blocks all feature creation** while uncommitted (`part.box`, `part.cylinder`, `part.sketch`, `part.workPlane`, `part.entityInjection`, etc.). `part.expression` is NOT blocked.
- **`getFeature` requires recalc.** Before `recalc`, `getFeature` cannot find uncommitted features by name; after, it can.
- **`deleteFeature` doesn't work on uncommitted features.** Decline (open + close) instead.
- **Default values** (e.g. CC_Box: length=100, width=100, height=100) are used if you commit without changing them.
- **Case-sensitive type.** `CC_Box` works; `cc_box` / `CC_BOX` / `Box` fail with "non-existent class".

## Valid Types

| CC_ Class | Corresponding API |
|---|---|
| `CC_Box` / `CC_Cylinder` / `CC_Sphere` / `CC_Cone` | `part.box` / `cylinder` / `sphere` / `cone` + `update*` |
| `CC_Extrusion` / `CC_Revolve` / `CC_Twist` | `part.extrusion` / `revolve` / `twist` + `update*` |
| `CC_Union` / `CC_Subtraction` / `CC_Intersection` | `part.boolean` (type UNION / SUBTRACTION / INTERSECTION) |
| `CC_BooleanOperation` | `part.boolean` (generic) |
| `CC_Fillet` / `CC_Chamfer` | `part.fillet` / `chamfer` + `update*` |
| `CC_Slice` / `CC_SliceBySheet` | `part.slice` / `sliceBySheet` + `update*` |
| `CC_Mirror` / `CC_LinearPattern` / `CC_CircularPattern` | `part.mirror` / `linearPattern` / `circularPattern` + `update*` |
| `CC_Translation` / `CC_Rotation` / `CC_TransformationByCSys` | `part.translation` / `rotation` / `transformationByCSys` + `update*` |
| `CC_Sketch` | `part.sketch` |
| `CC_WorkPlane` / `CC_WorkAxis` / `CC_WorkPoint` / `CC_WorkCSys` | `part.workPlane` / `workAxis` / `workPoint` / `workCSys` + `update*` |
| `CC_EntityInjection` | `part.entityInjection` |
| `CC_EntityDeletion` | `part.entityDeletion` / `part.updateEntityDeletion` |
| `CC_Import` | `part.importFeature` / `part.updateImportFeature` |
| `CC_CompositeCurve` | `part.compositeCurve` / `part.updateCompositeCurve` |

**Invalid names:** `CC_Boolean` (use CC_Union/CC_Subtraction/CC_Intersection), `CC_ImportFeature` (use CC_Import).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result

const cylId = (await api.v1.part.createUncommitedObject({
  id: partId, type: 'CC_Cylinder', name: 'MyCyl',
})).result

await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, height: 50, diameter: 30 })
await api.v1.part.closeFeature({ id: cylId })
// Committed with height=50, diameter=30
```

## Related

`part.openFeature` / `part.closeFeature` · `part.update*` · `part.getFeature`
