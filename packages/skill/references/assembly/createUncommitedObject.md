# assembly.createUncommitedObject

Creates an empty, uncommitted constraint/relation shell in an assembly. The object has default member values but no configuration until committed via `update*`. Used for two-phase constraint creation: create the placeholder, then configure and commit.

## Prerequisites

- An assembly root (`assembly.create`)

## Key Parameters

All three parameters are **required**:

- `id` — assembly root ID
- `type` — exact CC_ class name (case-sensitive). See [Valid Types](#valid-types) below.
- `name` — constraint name. Duplicate names with existing constraints are allowed.

## Return Value

Returns the constraint/relation ID (`result: id`). This ID can be used with `part.openFeature`, the corresponding `assembly.update*` API, and `part.closeFeature`.

## Commit vs Decline

Same pattern as `part.createUncommitedObject`, but uses `part.openFeature`/`part.closeFeature` (there is no assembly-specific open/close).

### Commit (constraint persists)

```js
const id = (await api.v1.assembly.createUncommitedObject({
  id: asmId,
  type: 'CC_FastenedConstraint',
  name: 'MyFastened',
})).result

await api.v1.part.openFeature({ id })
await api.v1.assembly.updateFastened({
  id,
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})
await api.v1.part.closeFeature({ id })
// Constraint is now committed and queryable via getFastened
```

### Decline (constraint removed)

```js
const id = (await api.v1.assembly.createUncommitedObject({
  id: asmId,
  type: 'CC_FastenedConstraint',
  name: 'Temp',
})).result

await api.v1.part.openFeature({ id })
await api.v1.part.closeFeature({ id })
// Constraint is removed, ID becomes invalid
```

Any `update*` call between open and close = commit. No `update*` call = decline.

## Gotchas

- **No singleton constraint (unlike part domain).** Multiple `createUncommitedObject` calls succeed without error. Assembly allows stacking uncommitted objects.
- **Blocks normal creation APIs.** While uncommitted objects exist, normal constraint creation APIs (`fastened`, `revolute`, `fastenedOrigin`, etc.) fail with: "There are too many uncommited objects. Check the implementation." You must commit or decline all uncommitted objects before using direct creation APIs.
- **Duplicate names allowed.** Creating an uncommitted object with the same name as an existing constraint succeeds.
- **Type strings are case-sensitive.** `CC_FastenedConstraint` works, `cc_fastenedconstraint` fails with "non-existent class".
- **Only constraint/relation types work.** Non-constraint types (CC_ProductReference, CC_Assembly, CC_Part) fail with "Function Initialize not found."

## Valid Types

| CC_ Class | Corresponding API |
|---|---|
| `CC_FastenedConstraint` | `assembly.fastened` / `assembly.updateFastened` |
| `CC_FastenedOriginConstraint` | `assembly.fastenedOrigin` / `assembly.updateFastenedOrigin` |
| `CC_RevoluteConstraint` | `assembly.revolute` / `assembly.updateRevolute` |
| `CC_CylindricalConstraint` | `assembly.cylindrical` / `assembly.updateCylindrical` |
| `CC_PlanarConstraint` | `assembly.planar` / `assembly.updatePlanar` |
| `CC_ParallelConstraint` | `assembly.parallel` / `assembly.updateParallel` |
| `CC_SliderConstraint` | `assembly.slider` / `assembly.updateSlider` |
| `CC_SphericalConstraint` | `assembly.spherical` / `assembly.updateSpherical` |
| `CC_GearRelation` | `assembly.gear` / `assembly.updateGear` |
| `CC_GroupConstraint` | `assembly.group` / `assembly.updateGroup` |
| `CC_LinearPatternConstraint` | `assembly.linearPattern` / `assembly.updateLinearPattern` |
| `CC_CircularPatternConstraint` | `assembly.circularPattern` / `assembly.updateCircularPattern` |

**Invalid names:** `CC_BallConstraint`, `CC_PrismaticConstraint` (non-existent classes). `CC_ProductReference`, `CC_Assembly`, `CC_Part` (not constraint types).

## Common Errors

| Error | Cause |
|---|---|
| `"The parameter \"id\" must be provided"` | Missing `id` param |
| `"The parameter \"type\" must be provided"` | Missing `type` param |
| `"The parameter \"name\" must be provided"` | Missing `name` param |
| `"non-existent class: X"` | Invalid or case-wrong type string |
| `"Function Initialize not found"` | Type is a valid CC_ class but not a constraint/relation |
| `"has an invalid id!"` | ID doesn't exist or isn't an assembly |
| `"too many uncommited objects"` | Attempting normal creation while uncommitted objects exist |

## When to Use

In most cases, call `assembly.fastened()` (or `revolute`, etc.) directly. The two-phase pattern is useful for:

- Interactive/UI workflows where a constraint placeholder is shown before user confirms parameters
- Programmatic workflows that need to reserve a constraint slot before knowing final mates/offsets

The committed result is identical to direct creation.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
// ... setup templates, instances, work coordinate systems ...

// Two-phase revolute creation
const revId = (await api.v1.assembly.createUncommitedObject({
  id: asmId,
  type: 'CC_RevoluteConstraint',
  name: 'Hinge',
})).result

await api.v1.part.openFeature({ id: revId })
await api.v1.assembly.updateRevolute({
  id: revId,
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})
await api.v1.part.closeFeature({ id: revId })
// Revolute constraint is now committed
```

## Related

- `part.createUncommitedObject` — same pattern for part features (singleton-constrained, unlike assembly)
- `part.openFeature` / `part.closeFeature` — required for commit/decline
- `assembly.update*` — the update APIs that configure the constraint between open and close
- `assembly.get*` — query committed constraints by name
