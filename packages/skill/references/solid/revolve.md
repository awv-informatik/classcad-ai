# solid.revolve

Creates a solid by revolving a closed 2D profile around an axis (point + direction) — like a lathe.

## Key Parameters

- `id` — entity injection feature ID (not part ID, not shape ID)
- `originPos` — `[x, y, z]` point the axis passes through; any point, not just the world origin. Sets where the ring/disc center is.
- `direction` — `[x, y, z]` axis direction; need not be normalized (`[1, 1, 0]` ≡ `[0.707, 0.707, 0]`), any non-zero vector
- `angle` — **radians**; `Math.PI * 2` = full 360°, partial values give arc-shaped solids
- `curves` — the profile: shape ID (scalar or array), array of closed-loop sketch-curve IDs, or a mix. NOT sketchRegion IDs. Full details: `solid/curves-parameter`.
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional post-creation transform; see `solid/generic`

## Return Value

Integer solid ID (e.g. `64`), maxLevel=31, messages=[]. On error `null`, maxLevel=51. **No `updateRevolve`** — `solid.deleteSolid` and recreate.

## Profile-Axis Relationship

| Profile vs axis | Result (no error) |
|---|---|
| Offset from axis (typical) | Ring/torus; offset distance = inner radius |
| Touching (one edge on axis) | Solid disc/cylinder |
| Crossing (straddles axis) | Solid of revolution, no hollow center |

## Angle Behavior

- **Positive** → counter-clockwise (right-hand rule around direction). **Negative** → opposite direction, equivalent to reversing `direction`.
- **angle=0 → silent degenerate case**: valid ID, maxLevel=31, zero-thickness geometry. **Always validate angle is non-zero.**
- **angle > 2π** → appears to cap at a full revolution; closed torus/disc, no error.
- **Very small** (e.g. 0.01) → thin sliver, valid.

## Gotchas

- **Open profiles fail:** `"Brep after revolve operation not manifold"` (code 0, level 51) — same kernel error family as `solid.extrusion`.
- **Direction `[0,0,0]` is risky** — likely degenerate (not tested separately; by analogy with extrusion's zero direction).
- **`curve.circle` uses `centerPos`, not `center`.** `center` makes circle creation fail silently (returns null), then revolve fails with `"NULLID not allowed"`.
- **`curve.circle` returns VOID** — pass the **shape ID** to `curves`.
- Sketches used as profiles must be created BEFORE `part.entityInjection` (see `solid/curves-parameter`).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Part ID or shape ID instead of EIF ID | Use the `part.entityInjection` ID |
| `"Brep after revolve operation not manifold"` (code 0, level 51) | Profile not closed | `close: true` on advancedPolyline, or closed curves |
| `"NULLID not allowed"` (code 0, level 51) | Shape has no valid curves (e.g. `curve.circle` failed silently) | Check curve creation succeeded |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Rectangular profile offset from the Y axis
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 40, ya: 0 }, { xa: 55, ya: 0 }, { xa: 55, ya: 15 }, { xa: 40, ya: 15 }],
  close: true,
})

// Full revolve around Y → ring
const revId = (await api.v1.solid.revolve({
  id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0], angle: Math.PI * 2, curves: shapeId,
})).result

// Partial (90°) with a translation
const revId2 = (await api.v1.solid.revolve({
  id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0], angle: Math.PI / 2, curves: shapeId,
  translation: [50, 0, 0],
})).result

// Circle profile → true torus
const circShape = (await api.v1.curve.shape({ id: eifId, name: 'CircProf' })).result
await api.v1.curve.circle({ id: circShape, centerPos: [45, 0, 0], radius: 8 })  // centerPos, not center
const torusId = (await api.v1.solid.revolve({
  id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0], angle: Math.PI * 2, curves: circShape,
})).result
```

## Related

`solid/curves-parameter` · `solid/generic` · `solid.extrusion` · `solid.deleteSolid` · `curve.shape` · `curve.circle`
