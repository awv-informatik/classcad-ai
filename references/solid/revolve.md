# solid.revolve

Creates a solid by revolving a closed 2D profile around an axis defined by a point and direction vector. Think lathe: the profile spins around the axis to sweep out a 3D shape.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`
- A closed profile: either a curve shape (`curve.shape` + drawing APIs) or sketch elements forming a closed loop

## Key Parameters

- `id` — entity injection feature ID (not part ID, not shape ID)
- `originPos` — `[x, y, z]` point that the rotation axis passes through. Does NOT have to be the world origin — any point works. This defines where the center of the ring/disc will be.
- `direction` — `[x, y, z]` rotation axis direction. Does NOT need to be normalized — `[1, 1, 0]` works the same as `[0.707, 0.707, 0]`. Any non-zero vector works.
- `angle` — rotation angle in **radians**. `Math.PI * 2` = full 360°. Partial values create arc-shaped solids.
- `curves` — the profile to revolve. Accepts TWO forms:
  - **Shape ID** (single value) — from `curve.shape`. Shape must contain closed curves.
  - **Array of sketch element IDs** — from sketch drawing APIs. Elements must form a closed loop.
- `rotation` — `[rx, ry, rz]` Euler angles in radians (optional). Post-creation transform.
- `translation` — `[x, y, z]` offset (optional). Post-creation transform.
- `rotateFirst` — boolean, default `true` (optional). When both rotation and translation are provided, determines ordering.

## Return Value

Returns an **integer solid ID** on success (e.g., `64`). maxLevel=31, messages=[].

On error, returns `null` with maxLevel=51.

**No `updateRevolve` method exists.** To modify, delete with `solid.deleteSolid` and recreate.

## Profile-Axis Relationship

The profile's position relative to the axis determines the shape:

- **Profile offset from axis** → creates a ring/torus (hollow center). This is the typical use case.
- **Profile touching the axis** (one edge at the axis) → creates a solid disc/cylinder. No error.
- **Profile crossing the axis** (profile straddles the axis) → creates a solid of revolution with no hollow center. Also valid, no error.

The distance from the profile to the axis determines the inner radius of the ring. A larger offset = larger hollow center.

## Angle Behavior

- **Positive angles** → standard counter-clockwise rotation (right-hand rule around direction).
- **Negative angles** → revolve in opposite direction. Equivalent to reversing the direction vector.
- **angle=0** → **silent degenerate case.** Returns a valid solid ID with maxLevel=31 and no error, but creates degenerate zero-thickness geometry. **Always validate angle is non-zero before calling.**
- **angle > 2*PI** → appears to cap at a full 360° revolution. No error, produces a closed torus/disc.
- **Very small angles** (e.g., 0.01 radians) → creates a very thin sliver. Valid.

## Gotchas

- **Open profiles fail.** If the profile is not closed (`close: false` on advancedPolyline, or non-looping curves), error: `"Brep after revolve operation not manifold"` (code 0, level 51). Same kernel error as `solid.extrusion`.
- **angle=0 is silently accepted.** Returns valid ID, no error — but degenerate geometry. Always check angle > 0.
- **Direction `[0,0,0]` is risky.** Zero-length direction vector will likely produce degenerate results (not tested separately, but by analogy with extrusion's zero direction behavior).
- **`curve.circle` uses `centerPos`, not `center`.** Using `center` causes circle creation to fail silently (returns null), which then causes revolve to fail with `"NULLID not allowed"`. This is a common parameter name mistake.
- **`curve.circle` returns VOID, not an ID.** The circle is added to the shape container. Pass the **shape ID** to `curves`, not the circle return value.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Passed part ID or shape ID instead of EIF ID | Use the ID from `part.entityInjection` |
| `"Brep after revolve operation not manifold"` (code 0, level 51) | Profile is not closed | Ensure `close: true` on advancedPolyline, or use closed curves |
| `"NULLID not allowed"` (code 0, level 51) | Shape has no valid curves (e.g., `curve.circle` failed silently) | Check that curve creation succeeded before calling revolve |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Create a rectangular profile offset from Y axis
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 40, ya: 0 },
    { xa: 55, ya: 0 },
    { xa: 55, ya: 15 },
    { xa: 40, ya: 15 },
  ],
  close: true,
})

// Full revolve around Y axis → torus-like ring
const revId = (await api.v1.solid.revolve({
  id: eifId,
  originPos: [0, 0, 0],
  direction: [0, 1, 0],
  angle: Math.PI * 2,
  curves: shapeId,
})).result
// revId → 64

// Partial revolve (90°) with transforms
const revId2 = (await api.v1.solid.revolve({
  id: eifId,
  originPos: [0, 0, 0],
  direction: [0, 1, 0],
  angle: Math.PI / 2,
  curves: shapeId,
  translation: [50, 0, 0],
})).result

// Circle profile → true torus
const circShape = (await api.v1.curve.shape({ id: eifId, name: 'CircProf' })).result
await api.v1.curve.circle({
  id: circShape,
  centerPos: [45, 0, 0],  // NOTE: centerPos, not center!
  radius: 8,
})
const torusId = (await api.v1.solid.revolve({
  id: eifId,
  originPos: [0, 0, 0],
  direction: [0, 1, 0],
  angle: Math.PI * 2,
  curves: circShape,
})).result
```

## Related

- `solid.extrusion` — sweep a profile along a vector (instead of revolving around an axis)
- `solid.deleteSolid` — remove solids from an EIF (no `updateRevolve` exists)
- `curve.shape` + `curve.advancedPolyline` — create rectangular/polygonal profiles
- `curve.circle` — create circular profiles (use `centerPos`, not `center`)
- `generic.md` — common transform parameters (rotation, translation, rotateFirst)
