# part.createUncommitedObject

Creates an empty, uncommitted feature shell in a part. The feature has default member values but no geometry until committed. Used for two-phase feature creation: create the placeholder, then configure and commit.

## Prerequisites

- A part (`part.create`)
- No other uncommitted feature may exist (singleton — only one at a time)

## Key Parameters

All three parameters are **required** — each produces a clear error when missing.

- `id` — part ID
- `type` — exact CC_ class name (case-sensitive). See [Valid Types](#valid-types) below.
- `name` — feature name. Duplicate names with existing features are allowed.

## Return Value

Returns the feature ID (`result: id`). This ID can be used with `openFeature`, the corresponding `update*` API, and `closeFeature`.

## Commit vs Decline

An uncommitted feature must be **committed** (with update) or **declined** (without update) before any other feature can be created.

### Commit (feature persists with geometry)

```js
const id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'MyBox' })).result
await api.v1.part.openFeature({ id })
await api.v1.part.updateBox({ id, length: 60, width: 40, height: 30 })
await api.v1.part.closeFeature({ id })
// Feature is now committed, has geometry, findable by getFeature
```

### Decline (feature removed)

```js
const id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Temp' })).result
await api.v1.part.openFeature({ id })
await api.v1.part.closeFeature({ id })
// Feature is removed from tree, ID becomes invalid
```

The key difference: **any** `update*` call between open and close = commit. No `update*` call = decline.

Calling `updateBox({})` with no dimension params is a valid no-op update that commits with default values (100x100x100 for a box).

## Gotchas

- **Singleton constraint.** Only one uncommitted feature at a time. Creating a second one fails with: "There is still an uncommited feature called 'X', please commit or decline the feature first."
- **Blocks all feature creation.** While uncommitted, ALL feature creation APIs are blocked (`part.box`, `part.cylinder`, `part.sketch`, `part.workPlane`, `part.entityInjection`, etc.). Expression creation (`part.expression`) is NOT blocked.
- **`getFeature` requires recalc.** Before calling `recalc`, `getFeature` cannot find uncommitted features by name. After `recalc`, it can.
- **`deleteFeature` doesn't work on uncommitted features.** Use the decline pattern (open + close) instead.
- **Default values.** Uncommitted features have default member values (e.g., CC_Box: length=100, width=100, height=100). These are used if you commit without changing them.
- **Type strings are case-sensitive.** `CC_Box` works, `cc_box` / `CC_BOX` / `Box` all fail with "non-existent class".

## Valid Types

### Part features (use with `part.createUncommitedObject`)

| CC_ Class | Corresponding API |
|---|---|
| `CC_Box` | `part.box` / `part.updateBox` |
| `CC_Cylinder` | `part.cylinder` / `part.updateCylinder` |
| `CC_Sphere` | `part.sphere` / `part.updateSphere` |
| `CC_Cone` | `part.cone` / `part.updateCone` |
| `CC_Extrusion` | `part.extrusion` / `part.updateExtrusion` |
| `CC_Revolve` | `part.revolve` / `part.updateRevolve` |
| `CC_Twist` | `part.twist` / `part.updateTwist` |
| `CC_Union` | `part.boolean` (type: UNION) |
| `CC_Subtraction` | `part.boolean` (type: SUBTRACTION) |
| `CC_Intersection` | `part.boolean` (type: INTERSECTION) |
| `CC_BooleanOperation` | `part.boolean` (generic) |
| `CC_Fillet` | `part.fillet` / `part.updateFillet` |
| `CC_Chamfer` | `part.chamfer` / `part.updateChamfer` |
| `CC_Slice` | `part.slice` / `part.updateSlice` |
| `CC_SliceBySheet` | `part.sliceBySheet` / `part.updateSliceBySheet` |
| `CC_Mirror` | `part.mirror` / `part.updateMirror` |
| `CC_LinearPattern` | `part.linearPattern` / `part.updateLinearPattern` |
| `CC_CircularPattern` | `part.circularPattern` / `part.updateCircularPattern` |
| `CC_Translation` | `part.translation` / `part.updateTranslation` |
| `CC_Rotation` | `part.rotation` / `part.updateRotation` |
| `CC_TransformationByCSys` | `part.transformationByCSys` / `part.updateTransformationByCSys` |
| `CC_Sketch` | `part.sketch` |
| `CC_WorkPlane` | `part.workPlane` / `part.updateWorkPlane` |
| `CC_WorkAxis` | `part.workAxis` / `part.updateWorkAxis` |
| `CC_WorkPoint` | `part.workPoint` / `part.updateWorkPoint` |
| `CC_WorkCSys` | `part.workCSys` / `part.updateWorkCSys` |
| `CC_EntityInjection` | `part.entityInjection` |
| `CC_EntityDeletion` | `part.entityDeletion` / `part.updateEntityDeletion` |
| `CC_Import` | `part.importFeature` / `part.updateImportFeature` |
| `CC_CompositeCurve` | `part.compositeCurve` / `part.updateCompositeCurve` |

**Invalid names:** `CC_Boolean` (use CC_Union/CC_Subtraction/CC_Intersection), `CC_ImportFeature` (use CC_Import).

## When to Use

In most cases, call `part.box()` directly instead of `createUncommitedObject`. The two-phase pattern is useful for:

- Interactive/UI workflows where a feature placeholder is shown before the user confirms parameters
- Programmatic workflows that need to reserve a position in the operation sequence before knowing final parameters

The committed result is identical to direct creation.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result

// Two-phase creation
const cylId = (await api.v1.part.createUncommitedObject({
  id: partId,
  type: 'CC_Cylinder',
  name: 'MyCyl',
})).result

await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, height: 50, diameter: 30 })
await api.v1.part.closeFeature({ id: cylId })
// Cylinder is now committed with height=50, diameter=30
```

## Related

- `part.openFeature` / `part.closeFeature` — required for commit/decline
- `part.update*` — the update APIs that configure the feature between open and close
- `part.getFeature` — find committed features by name (requires `recalc` for uncommitted)
