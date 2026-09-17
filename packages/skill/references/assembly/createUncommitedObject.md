# assembly.createUncommitedObject

Creates an empty, uncommitted constraint/relation shell in an assembly (default member values, no configuration). Two-phase creation: create the placeholder, then configure and commit via `update*`. Usually just call `assembly.fastened()` etc. directly; this pattern suits UI workflows that show a placeholder before the user confirms, or code that reserves a constraint slot before mates/offsets are known. The committed result is identical to direct creation.

## Key Parameters

All **required**:

- `id` — assembly root ID
- `type` — exact CC_ class name, case-sensitive (see Valid Types)
- `name` — constraint name; duplicates of existing constraint names are allowed

## Return Value

The constraint/relation ID, usable with `part.openFeature`, the matching `assembly.update*`, and `part.closeFeature`.

## Commit vs Decline

Same pattern as `part.createUncommitedObject`, using `part.openFeature`/`part.closeFeature` (no assembly-specific open/close). Any `update*` call between open and close = **commit** (constraint persists, queryable via `get*`). No `update*` call = **decline** (constraint removed, ID becomes invalid).

## Valid Types

| CC_ Class | Corresponding API |
|---|---|
| `CC_FastenedConstraint` | `fastened` / `updateFastened` |
| `CC_FastenedOriginConstraint` | `fastenedOrigin` / `updateFastenedOrigin` |
| `CC_RevoluteConstraint` | `revolute` / `updateRevolute` |
| `CC_CylindricalConstraint` | `cylindrical` / `updateCylindrical` |
| `CC_PlanarConstraint` | `planar` / `updatePlanar` |
| `CC_ParallelConstraint` | `parallel` / `updateParallel` |
| `CC_SliderConstraint` | `slider` / `updateSlider` |
| `CC_SphericalConstraint` | `spherical` / `updateSpherical` |
| `CC_GearRelation` | `gear` / `updateGear` |
| `CC_GroupConstraint` | `group` / `updateGroup` |
| `CC_LinearPatternConstraint` | `linearPattern` / `updateLinearPattern` |
| `CC_CircularPatternConstraint` | `circularPattern` / `updateCircularPattern` |

Invalid: `CC_BallConstraint`, `CC_PrismaticConstraint` (non-existent classes); `CC_ProductReference`, `CC_Assembly`, `CC_Part` (not constraint types).

## Gotchas

- **No singleton (unlike part domain).** Multiple `createUncommitedObject` calls succeed; uncommitted objects can stack.
- **Blocks normal creation APIs.** While uncommitted objects exist, `fastened`, `revolute`, `fastenedOrigin`, etc. fail with "There are too many uncommited objects. Check the implementation." Commit or decline all of them first.

## Common Errors

| Error | Cause |
|---|---|
| `"The parameter \"id\" must be provided"` (same for `type`, `name`) | Missing param |
| `"non-existent class: X"` | Invalid or case-wrong type (`cc_fastenedconstraint`) |
| `"Function Initialize not found"` | Valid CC_ class but not a constraint/relation |
| `"has an invalid id!"` | ID doesn't exist or isn't an assembly |
| `"too many uncommited objects"` | Normal creation while uncommitted objects exist |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcs1 = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result
const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
const wcs2 = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'I2' })).result

// Commit: update between open and close
const revId = (await api.v1.assembly.createUncommitedObject({
  id: asmId, type: 'CC_RevoluteConstraint', name: 'Hinge',
})).result
await api.v1.part.openFeature({ id: revId })
await api.v1.assembly.updateRevolute({
  id: revId,
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})
await api.v1.part.closeFeature({ id: revId })

// Decline: no update → constraint removed
const tmp = (await api.v1.assembly.createUncommitedObject({
  id: asmId, type: 'CC_FastenedConstraint', name: 'Temp',
})).result
await api.v1.part.openFeature({ id: tmp })
await api.v1.part.closeFeature({ id: tmp })
```

## Related

`part.createUncommitedObject` · `part.openFeature` / `part.closeFeature` · `assembly.update*` · `assembly.get*`
