# solid.mirror

Mirrors a solid across a plane defined by an origin point and a normal vector. The solid is modified in place — no new solid is created.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- A solid in that EIF

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
- `target` — solid ID to mirror. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
- `originPos` — `[x, y, z]` point on the mirror plane. This defines WHERE the plane sits, not just the direction. Required — code 1004 if omitted.
- `normal` — `[x, y, z]` normal vector of the mirror plane. Required — code 1004 if omitted.

All four parameters are required.

## Return Value

Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].

## Behavior

- **In-place modification.** The target solid is reflected across the plane. No copy is created.
- **Auto-normalizes.** The normal vector does not need to be unit length. `[5, 0, 0]` behaves identically to `[1, 0, 0]`.
- **Normal direction is irrelevant.** `[1, 0, 0]` and `[-1, 0, 0]` define the same plane and produce identical results. Only the plane orientation matters.
- **Double mirror = identity.** Two mirrors across the same plane restore the original position exactly.
- **Properly handles normals.** Unlike `solid.scale` with a negative factor (which flips geometry inside-out), mirror correctly reflects face normals. No rendering artifacts or broken booleans.
- **Works on all solid types.** Box, sphere, cylinder, cone, and compound (post-boolean) solids all mirror correctly.
- **Cumulative with other transforms.** Mirror can be chained with `solid.translation`, `solid.rotation`, `solid.scale`. Each transform applies to the solid's current state.
- **No `updateMirror` method exists.** To undo, mirror across the same plane again.

## Common Mirror Planes

| Plane | originPos | normal | Effect |
|---|---|---|---|
| YZ (reflect X) | `[0,0,0]` | `[1,0,0]` | Negates X coordinates |
| XZ (reflect Y) | `[0,0,0]` | `[0,1,0]` | Negates Y coordinates |
| XY (reflect Z) | `[0,0,0]` | `[0,0,1]` | Negates Z coordinates |
| Offset YZ at X=50 | `[50,0,0]` | `[1,0,0]` | Reflects around X=50 |
| 45° diagonal | `[0,0,0]` | `[1,1,0]` | Swaps X↔Y (with negation) |

## Gotchas

- **`id` is the EIF ID, not the part ID.** Same as all `solid.*` transforms.
- **Consumed tool solids are invalid.** After a boolean with `keepTools: false` (default), the tool solid ID is dead.
- **Zero normal vector is an error.** Produces kernel error: `"Invalid mirror normal!"` (code 0, level 51). This is a kernel-level error, not a parameter validation error.
- **`originPos` matters.** Mirroring across `originPos=[0,0,0]` vs `originPos=[50,0,0]` with the same normal gives completely different results. The origin point pins the plane in space.
- **Auto-scaling hides single-body mirrors in snapshots.** If verifying visually, include a fixed reference body.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Passed part ID instead of EIF ID | Use the entity injection feature ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Passed non-solid ID as target | Use a solid ID |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID | Check the solid wasn't consumed by a boolean |
| `"The parameter \"originPos\" must be provided!"` | 1004 | Missing originPos param | Always provide `[x, y, z]` point |
| `"The parameter \"normal\" must be provided!"` | 1004 | Missing normal param | Always provide `[x, y, z]` vector |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target param | Always provide the solid ID |
| `"The parameter \"id\" must be provided!"` | 1004 | Missing id param | Always provide the EIF ID |
| `"Invalid mirror normal!"` | 0 | Zero vector `[0,0,0]` as normal | Use a non-zero normal vector |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({
  id: eifId, length: 80, width: 40, height: 30,
  translation: [20, 10, 0],
})).result

// Mirror across YZ plane (negate X)
const r = await api.v1.solid.mirror({
  id: eifId,
  target: boxId,
  originPos: [0, 0, 0],
  normal: [1, 0, 0],
})
// r.result === boxId (same ID returned)
// r.maxLevel === 31

// Mirror across offset plane at X=50
await api.v1.solid.mirror({
  id: eifId,
  target: boxId,
  originPos: [50, 0, 0],
  normal: [1, 0, 0],
})
```

## Related

- `solid.translation` — translate a solid by a vector
- `solid.rotation` — rotate a solid by Euler angles
- `solid.scale` — scale a solid by a factor (negative factor flips normals — use `mirror` instead)
- `solid.copy` — copy a solid (supports translation + rotation at creation)
