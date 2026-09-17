# assembly.spherical

Spherical (ball-joint) constraint between two instances. Locks the 3 translations (csys origins coincide); all 3 rotations stay free.

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId }`
- `yRotationLimits` — `{ max }` only (no `min`): max rotation around Y. Radians or degree string; `'45deg'` is stored as 0.7853981633974483. Omit or `null` for no limit
- `name` — default `"Spherical"`

## Alignment Semantics (CRITICAL)

**The csys origins are the ball center.** inst2 moves so mate2's csys origin coincides with mate1's; orientation stays free — inst2 keeps its current orientation (created at 45° about Z → stays at 45°). Example: mate1 csys at `offset [40,0,20]`, mate2 csys at its part origin → inst2 at `[40,0,20]`, orientation unchanged. Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`.

**No offset params** (unlike revolute, cylindrical, slider, parallel). The only ways to separate the instances are `moveUnderConstraints` or removing the constraint. Free rotations become active only via `moveUnderConstraints` or interacting constraints.

**`mate.flip` / `mate.reorient` have NO effect.** They are accepted without error, but free rotation absorbs them (contrast: slider locks all rotation → always visible; revolute → some flips visible; parallel → some absorbed).

## Return Value

Constraint ID; array call → `Array<id>`, one per constraint:

```js
await api.v1.assembly.spherical([
  { id: asmId, name: 'Ball_A', mate1: {...}, mate2: {...} },
  { id: asmId, name: 'Ball_B', mate1: {...}, mate2: {...}, yRotationLimits: { max: '90deg' } },
]) // → [constraintIdA, constraintIdB]
```

## getSpherical / updateSpherical

- `getSpherical({ id: assemblyId, name })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → null, "not a Assembly"). Returns `{ id, name, mate1, mate2, yRotationLimits }` with full mate details (path, csys, flip, reorient); `yRotationLimits` is always `{ max }` with a number or `null`. Not found → `result: null`, maxLevel 51, error code 0.
- `updateSpherical({ id: constraintId, ... })` — takes the **constraint ID**. True partial update:
  - `yRotationLimits: { max: '60deg' }` adds/changes; `yRotationLimits: null` removes
  - `name: 'NewName'` — old name immediately unfindable
  - `mate2: { path: [newInst], csys: wcs }` — remate; repositions the new instance

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "belong to the same rigid set" | 1014 | Same instance in both mates |
| "csys must be provided" | 1004 | Missing csys in mate |
| "not supported as flip type" | 1013 | Invalid flip string |
| "wrong id type, provide instance" | 1001 | Template ID in path instead of instance ID |
| "not an assembly id" | 1007 | Instance/template ID passed as `id` |
| "not a constraint or relation" | 1007 | Assembly ID passed to updateSpherical |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 10, height: 8 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result  // csys at part origin

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl2, name: 'B', length: 60, width: 60, height: 10 })
const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'Mate' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, mate1: { path: [inst1], csys: wcs2 } })

const sId = (await api.v1.assembly.spherical({
  id: asmId, name: 'BallJoint',
  mate1: { path: [inst1], csys: wcs2 },
  mate2: { path: [inst2], csys: wcs },
  yRotationLimits: { max: '45deg' },
})).result

const state = (await api.v1.assembly.getSpherical({ id: asmId, name: 'BallJoint' })).result
await api.v1.assembly.updateSpherical({ id: sId, yRotationLimits: null })  // remove limit
```

## Related

`assembly.fastened` · `assembly.revolute` · `assembly.cylindrical` · `assembly.slider` · `assembly.planar` · `assembly.parallel`
