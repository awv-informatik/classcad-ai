# solid.rotation

Rotates a solid by a rotation vector `[rx, ry, rz]` in radians. The rotation is applied in Z→Y→X order (Euler angles) around the **part coordinate system origin** — not the body center. The solid is modified in place.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- A solid in that EIF

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
- `target` — solid ID to rotate. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
- `rotation` — `[rx, ry, rz]` vector in **radians**. Each component is the rotation around that axis. Required — code 1004 if omitted.

## Return Value

Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].

## Behavior

- **Angles are in radians.** π/2 ≈ 1.5708 = 90°. π ≈ 3.14159 = 180°. 2π ≈ 6.28318 = 360°.
- **Rotation order is Z→Y→X (Euler angles).** A single call `rotation: [rx, ry, rz]` applies Z first, then Y, then X. This is an intrinsic Euler convention — after the Z rotation, the Y rotation happens in the Z-rotated frame, then X in the ZY-rotated frame.
- **Combined ≠ sequential.** `rotation([π/4, π/4, 0])` is NOT the same as two separate calls `rotation([0, π/4, 0])` then `rotation([π/4, 0, 0])`. A single combined call uses Euler decomposition; separate calls each rotate around world axes at the solid's current orientation.
- **Rotation center is the origin.** Rotation is around the part coordinate system origin `[0,0,0]`. A body offset from the origin will **orbit** around it, not spin in place. To rotate a body around its own center: translate to origin → rotate → translate back.
- **Cumulative.** Successive single-axis calls stack: two calls of `[0, 0, π/4]` equal one `[0, 0, π/2]`.
- **Zero vector is a no-op.** `[0, 0, 0]` succeeds silently.
- **Negative angles work.** Positive = counterclockwise (right-hand rule), negative = clockwise.
- **No upper bound.** Angles >2π wrap naturally (e.g., 3π = π = 180°). No error on large values.
- **Works on compound solids.** After a boolean union, rotating the target moves the entire compound.
- **No `updateRotation` method exists.** To undo, apply the inverse rotation (negate all components).
- **Order with translation matters.** Since rotation orbits around the origin, `rotate → translate` gives a different result than `translate → rotate`.

## Gotchas

- **`id` is the EIF ID, not the part ID.** Same as all `solid.*` transforms.
- **Consumed tool solids are invalid.** After a boolean with `keepTools: false`, the tool ID is dead.
- **Rotation orbits, doesn't spin.** If your body is at `[80, 0, 0]` and you rotate 90° around Z, it ends up at `[0, 80, 0]` — it orbited the origin. This catches people who expect in-place rotation.
- **Don't combine multi-axis in one call unless you mean Euler angles.** For predictable results with multi-axis rotations, make separate single-axis calls if you want world-axis rotations.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Passed part ID instead of EIF ID | Use the entity injection feature ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Passed non-solid ID as target | Use a solid ID |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID | Check the solid wasn't consumed by a boolean |
| `"The parameter \"rotation\" must be provided!"` | 1004 | Missing rotation param | Always provide `[rx, ry, rz]` vector |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target param | Always provide the solid ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result

// Rotate 45° around Z axis
const r = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, Math.PI / 4] })
// r.result === boxId (same ID returned)
// r.maxLevel === 31

// To rotate around body center (not origin), offset first:
const box2 = (await api.v1.solid.box({ id: eifId, length: 50, width: 30, height: 20, translation: [100, 0, 0] })).result
await api.v1.solid.translation({ id: eifId, target: box2, translation: [-100, 0, 0] }) // move to origin
await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, Math.PI / 4] }) // rotate
await api.v1.solid.translation({ id: eifId, target: box2, translation: [100, 0, 0] }) // move back
```

## Related

- `solid.translation` — translate a solid by a vector
- `solid.scale` — scale a solid by a factor
- `solid.mirror` — mirror a solid across a plane
- `solid.copy` — copy a solid (supports translation + rotation params at creation time)
