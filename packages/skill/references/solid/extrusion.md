# solid.extrusion

Creates a solid by sweeping a closed 2D profile along a direction vector. The profile can come from a curve shape or from sketch elements.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`
- A closed profile: either a curve shape (`curve.shape` + drawing APIs) or sketch elements that form a closed loop

## Key Parameters

- `id` — entity injection feature ID (not part ID, not shape ID)
- `direction` — `[x, y, z]` vector. **The magnitude IS the extrusion distance.** `[0, 0, 40]` extrudes 40 units along Z. `[1, 1, 1]` extrudes ~1.73 units along the diagonal. This is NOT a unit direction + separate distance.
- `curves` — the profile to extrude. Accepts IDs of type `"shape"` or `"sketch-curve"`. See `curves-parameter.md` for full details. Short version:
  - **Shape ID** (scalar or in array) — from `curve.shape`. The shape must contain closed curves.
  - **Array of sketch-curve IDs** — from `sketch.rectangle`, `sketch.line`, `sketch.circle`, etc. Must form a closed loop.
  - **Mixed** — shape IDs and sketch-curve IDs can be combined in one array.
  - **NOT accepted:** sketchRegion IDs (different type).
- `rotation` — `[rx, ry, rz]` Euler angles in radians (optional). Same behavior as primitives.
- `translation` — `[x, y, z]` offset (optional). Same behavior as primitives.
- `rotateFirst` — boolean, default `true` (optional). Same behavior as primitives.

## Return Value

Returns an **integer solid ID** on success (e.g., `64`). maxLevel=31, messages=[].

On error, returns `null` with maxLevel=51 and descriptive error messages.

## Profile Types That Work

Any closed 2D profile works:
- Rectangles (`advancedPolyline` with 4 points, `close: true`)
- Arbitrary polygons (L-shapes, stars, etc.)
- Circles (`curve.circle`)
- Rounded shapes (`advancedPolyline` with `r:` fillet radii at corners)
- Sketch-drawn geometry (rectangle, lines forming a closed loop)

## Gotchas

- **Open profiles fail.** If the profile is not closed (`close: false` on advancedPolyline, or sketch lines that don't form a loop), you get error: `"Brep after linear sweep not manifold"` (maxLevel=51). The error comes from the kernel, not a parameter check.
- **Zero direction `[0,0,0]` is accepted silently.** Returns a valid solid ID with maxLevel=31, but creates degenerate zero-thickness geometry. No warning. **Always validate direction is non-zero before calling.**
- **Direction magnitude matters.** `[0, 0, 1]` is a valid extrusion of 1 unit — very thin. If your extrusion looks paper-thin, check the vector length.
- **Negative direction is valid.** `[0, 0, -40]` extrudes in the negative Z direction. No special handling needed.
- **Profile lives in the XY plane.** Curve shapes define geometry in 2D (X/Y coordinates). The extrusion direction sweeps this profile in 3D. Typically you define the profile in XY and extrude along Z, but any direction works.
- **No `updateExtrusion` method exists.** To modify an extrusion, delete it with `solid.deleteSolid` and recreate.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Passed part ID or shape ID instead of EIF ID | Use the ID from `part.entityInjection` |
| `"Brep after linear sweep not manifold"` (code 0, level 51) | Profile is not closed | Ensure `close: true` on advancedPolyline, or use closed curves |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Option A: Extrusion from curve shape
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 80, ya: 0 },
    { xa: 80, ya: 50 },
    { xa: 0, ya: 50 },
  ],
  close: true,
})
const extId = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 40],
  curves: shapeId,
})).result
// extId → 64

// Option B: Extrusion from sketch element IDs
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0],
})).result
// lineIds → [66, 72, 78, 84]
const extId2 = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 40],
  curves: lineIds,
})).result

// With transforms
const extId3 = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 40],
  curves: shapeId,
  translation: [100, 0, 0],
  rotation: [0, 0, Math.PI / 4],
})).result
```

## Related

- `curves-parameter.md` — full reference on the `curves` parameter (accepted types, mixing, edge cases)
- `solid.revolve` — revolve a profile around an axis (instead of sweeping along a vector)
- `solid.deleteSolid` — remove solids from an EIF
- `curve.shape` + `curve.advancedPolyline` — create the profile for extrusion
- `curve.circle` — create a circular profile (extrudes into a cylinder)
- `sketch.rectangle` / `sketch.line` — alternative: sketch-based profile
- `generic.md` — common transform parameters (rotation, translation, rotateFirst)
