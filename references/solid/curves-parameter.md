# The `curves` Parameter (solid.extrusion & solid.revolve)

The `curves` parameter on `solid.extrusion` and `solid.revolve` defines the 2D profile to sweep into a 3D solid. It accepts two ID types — **shape** and **sketch-curve** — and is more flexible than the docs suggest.

## Accepted ID Types

The server validates that `curves` contains only IDs of type `"shape"` or `"sketch-curve"`. Any other ID type produces:

```
"The parameter \"curves\" has a wrong id type! Provide only following id types: [\"shape\",\"sketch-curve\"]"
```

- **shape** — a `curve.shape` container (from `curve.shape({ id: eifId, ... })`). Contains curves drawn with `curve.advancedPolyline`, `curve.circle`, etc.
- **sketch-curve** — individual sketch geometry elements (from `sketch.line`, `sketch.rectangle`, `sketch.circle`, `sketch.arc`, etc.)

**NOT accepted:**
- sketchRegion IDs — different type, explicitly rejected
- part IDs, EIF IDs, solid IDs — all wrong type

## Input Forms

The parameter is flexible about scalar vs array:

| Form | Works? | Example |
|---|---|---|
| Shape ID as scalar | ✅ | `curves: shapeId` |
| Shape ID in array | ✅ | `curves: [shapeId]` |
| Array of sketch-curve IDs | ✅ | `curves: [lineId1, lineId2, lineId3, lineId4]` |
| Single sketch-curve as scalar | ✅ only if closed (circle) | `curves: circleId` |
| Mixed shape + sketch-curve IDs | ✅ | `curves: [shapeId, lineId1, lineId2]` |
| Empty array | ❌ type error | `curves: []` |

## Closed Loop Requirement

The curves must form a **closed loop** for the sweep to succeed. This is enforced by the geometry kernel, not the parameter validator — so you get a kernel error, not a parameter error:

```
"Brep after linear sweep not manifold"  (extrusion)
"Brep after revolve operation not manifold"  (revolve)
```

A single line, two lines, or any partial set of curves that don't close will fail. A single `sketch.circle` works as a standalone curve because it's inherently closed.

## Cross-Source Mixing

The kernel doesn't care where the curves come from:

- **Cross-sketch:** Elements from different sketches can be combined in one array, as long as they form a closed loop in 3D space.
- **Shape + sketch mix:** A shape ID and sketch-curve IDs can coexist in the same array. The kernel combines all curves regardless of source.
- **Multiple shapes:** Multiple shape IDs in one array (untested but likely works given the flexible mixing).

## Behavior Across APIs

`solid.extrusion` and `solid.revolve` handle `curves` identically. Both accept the same forms, same ID types, same mixing rules. No behavioral differences.

## Gotchas

- **Curves from NON-default-plane sketches work in world space** (verified 2026-08-10,
  sprocket-solid-A): arcs/lines on a Right-plane sketch extrude with a world `direction`
  perpendicular to that plane exactly as expected. Combined with the `rotation`/`translation`
  post-transforms this gives a solid-API "circular pattern" idiom: draw ONE profile, then N
  `solid.extrusion` calls with `rotation: [k*2π/N, 0, 0]` — used to cut all 21 tooth spaces of a
  sprocket from a single 8-curve profile, verified volume-exact vs the feature-tree build.
- **sketchRegion ≠ sketch-curve.** `sketch.sketchRegion` creates a region object — it's a different type than the individual sketch geometry (lines, arcs, circles). Don't confuse them. `part.extrusion` (the feature version) accepts sketchRegion via its `references` param, but `solid.extrusion` does NOT.
- **`sketch.circle` returns an ID; `curve.circle` returns VOID.** Sketch circles can be passed directly as a single curve. Curve circles are added to their shape container — pass the shape ID instead.
- **Empty array is a type error**, not just "no curves found." The error message differs: `"wrong type"` vs `"wrong id type"`.
- **Partial loops pass param validation but fail at kernel.** The parameter accepts any `sketch-curve` IDs without checking if they form a loop. The manifold check happens later during geometry construction.

## Working Examples

```js
const partId = (await api.v1.part.create({ name: 'CurvesDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// --- Form 1: Shape ID (most common) ---
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 60, ya: 0 },
    { xa: 60, ya: 40 },
    { xa: 0, ya: 40 },
  ],
  close: true,
})
const ext1 = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 30],
  curves: shapeId,  // scalar shape ID
})).result

// --- Form 2: Sketch element IDs ---
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineIds = (await api.v1.sketch.rectangle({
  id: skId,
  startPos: [0, 0, 0],
  endPos: [60, 40, 0],
})).result
// lineIds = [66, 72, 78, 84] — four line IDs
const ext2 = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 30],
  curves: lineIds,  // array of sketch-curve IDs
})).result

// --- Form 3: Single sketch circle (scalar) ---
const circId = (await api.v1.sketch.circle({
  id: skId,
  centerPos: [30, 30, 0],
  radius: 20,
})).result
const ext3 = (await api.v1.solid.extrusion({
  id: eifId,
  direction: [0, 0, 30],
  curves: circId,  // scalar sketch-curve ID (circle is closed)
})).result
```

## Related

- `solid.extrusion` — sweep along direction vector
- `solid.revolve` — sweep around axis
- `curve.shape` — create a shape container for curve.* APIs
- `sketch.rectangle`, `sketch.line`, `sketch.circle` — create sketch-curve elements
- `part.extrusion` — feature version that uses `references` param (accepts sketchRegion, different from `curves`)
