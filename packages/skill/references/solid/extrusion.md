# solid.extrusion

Creates a solid by sweeping a closed 2D profile (curve shape or sketch elements) along a direction vector.

## Key Parameters

- `id` — entity injection feature (EIF) ID (not part ID, not shape ID)
- `direction` — `[x, y, z]`. **The magnitude IS the extrusion distance** — not a unit direction + distance. `[0, 0, 40]` extrudes 40 along Z; `[1, 1, 1]` extrudes ~1.73 along the diagonal; `[0, 0, 1]` is a valid 1-unit (paper-thin) extrusion. Negative is valid (`[0, 0, -40]` → −Z).
- `curves` — the profile: shape ID (scalar or array), array of closed-loop sketch-curve IDs, or a mix. NOT sketchRegion IDs. Full details: `solid/curves-parameter`.
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional; same as primitives, see `solid/generic`

## Return Value

Integer solid ID (e.g. `64`), maxLevel=31, messages=[]. On error `null`, maxLevel=51 with descriptive messages.

## Profiles

Any closed profile works: rectangles (`advancedPolyline`, 4 points, `close: true`), arbitrary polygons (L-shapes, stars), `curve.circle`, rounded shapes (`advancedPolyline` with `r:` corner radii), sketch geometry forming a closed loop. Curve shapes are 2D (XY); the direction sweeps them in 3D — typically along Z, but any direction works.

## Gotchas

- **Open profiles fail** (`close: false`, or sketch lines not forming a loop): kernel error `"Brep after linear sweep not manifold"` (maxLevel=51), not a parameter check.
- **Zero direction `[0,0,0]` is accepted silently** — valid ID, maxLevel=31, degenerate zero-thickness geometry, no warning. **Always validate direction is non-zero.**
- **No `updateExtrusion`.** To modify, `solid.deleteSolid` and recreate.
- Sketches used as profiles must be created BEFORE `part.entityInjection` (see `solid/curves-parameter`).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Part ID or shape ID instead of EIF ID | Use the `part.entityInjection` ID |
| `"Brep after linear sweep not manifold"` (code 0, level 51) | Profile not closed | `close: true` on advancedPolyline, or closed curves |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
// Option B's sketch must precede the EIF
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const lineIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Option A: curve shape
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 0, ya: 0 }, { xa: 80, ya: 0 }, { xa: 80, ya: 50 }, { xa: 0, ya: 50 }],
  close: true,
})
const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: shapeId })).result

// Option B: sketch element IDs
const extId2 = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: lineIds, translation: [0, 100, 0] })).result

// With transforms
const extId3 = (await api.v1.solid.extrusion({
  id: eifId, direction: [0, 0, 40], curves: shapeId,
  translation: [100, 0, 0], rotation: [0, 0, Math.PI / 4],
})).result
```

## Related

`solid/curves-parameter` · `solid/generic` · `solid.revolve` · `solid.deleteSolid` · `curve.shape` · `curve.circle` · `sketch.rectangle` / `sketch.line`
