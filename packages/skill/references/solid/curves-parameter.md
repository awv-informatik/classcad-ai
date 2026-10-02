# The `curves` Parameter (solid.extrusion & solid.revolve)

Defines the 2D profile swept into a solid. `solid.extrusion` and `solid.revolve` handle it identically (same forms, ID types, mixing rules).

## Accepted ID Types

Only `"shape"` or `"sketch-curve"` IDs; anything else →

```
"The parameter \"curves\" has a wrong id type! Provide only following id types: [\"shape\",\"sketch-curve\"]"
```

- **shape** — a `curve.shape` container (`curve.shape({ id: eifId, ... })`) holding curves from `curve.advancedPolyline`, `curve.circle`, etc.
- **sketch-curve** — individual sketch elements (`sketch.line`, `sketch.rectangle`, `sketch.circle`, `sketch.arc`, …)
- **NOT accepted:** sketchRegion IDs (a different type; `part.extrusion` accepts them via `references`, `solid.extrusion` does not), part/EIF/solid IDs.

## Input Forms

| Form | Works? | Example |
|---|---|---|
| Shape ID as scalar | ✅ | `curves: shapeId` |
| Shape ID in array | ✅ | `curves: [shapeId]` |
| Array of sketch-curve IDs | ✅ | `curves: [lineId1, lineId2, lineId3, lineId4]` |
| Single sketch-curve as scalar | ✅ only if closed (circle) | `curves: circleId` |
| Mixed shape + sketch-curve IDs | ✅ | `curves: [shapeId, lineId1, lineId2]` |
| Empty array | ❌ type error (`"wrong type"`, not `"wrong id type"`) | `curves: []` |

Sources can mix freely: elements from different sketches in one array (if they close a loop in 3D), shapes plus sketch curves. Multiple shape IDs in one array are untested but likely work.

## Closed Loop Requirement

Curves must form a **closed loop**. Param validation accepts any sketch-curve IDs; the kernel checks later, so partial loops (a single line, two lines, …) fail with a kernel error:

```
"Brep after linear sweep not manifold"  (extrusion)
"Brep after revolve operation not manifold"  (revolve)
```

A single `sketch.circle` works alone because it is closed.

## Gotchas

- **Prefer curve-API shapes INSIDE the EIF over sketch curves.** The EIF is a feature in the operation sequence and may only consume objects from EARLIER features — a sketch created after the EIF is a later feature; referencing its curves runs the sequence backwards (it can appear to work, but the model is wrong in the tree). If a sketch (e.g. for 2D constraints) is genuinely needed, create it BEFORE `part.entityInjection`. Idiomatic direct modeling: `curve.shape` + `curve.polyline2d`/`advancedPolyline` in the EIF.
- **Arc-heavy profiles: one `curve.polyline2d` with signed bulges.** Per-segment bulge `tan(sweep/4)`; positive = counterclockwise seen from +Z = arc right of the travel direction, so the sign depends on the outline's winding (outward on a counterclockwise outline). Chained `curve.line` + arc calls extrude exactly as well — but `curve.arcByCenter`'s `isClockwise` means major (`true`) / minor (`false`) arc, not a world direction, and its semicircles ignore the flag (use `arcBy3Points`). A wrong flag is the usual cause of a degenerate or oversized chained profile.
- **Solid-API "circular pattern" idiom:** draw ONE profile shape, then N `solid.extrusion` calls with `rotation: [0, 0, k*2π/N]` — cut all 21 tooth spaces of a sprocket from one profile, volume-exact vs the feature-tree build.
- **`sketch.circle` returns an ID; `curve.circle` returns VOID** (it is added to its shape — pass the shape ID).

## Working Examples

```js
const partId = (await api.v1.part.create({ name: 'CurvesDemo' })).result
// Sketch (if needed) BEFORE the EIF
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const lineIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result // four line IDs
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 100, 0], radius: 20 })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Form 1: shape ID (most common)
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 0, ya: 0 }, { xa: 60, ya: 0 }, { xa: 60, ya: 40 }, { xa: 0, ya: 40 }],
  close: true,
})
const ext1 = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 30], curves: shapeId })).result

// Form 2: array of sketch-curve IDs
const ext2 = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 30], curves: lineIds, translation: [100, 0, 0] })).result

// Form 3: single closed sketch circle as scalar
const ext3 = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 30], curves: circId })).result
```

## Related

`solid.extrusion` · `solid.revolve` · `curve.shape` · `curve.polyline2d` · `sketch.rectangle` · `part.extrusion`
