# sketch.moveGeometry

Moves sketch geometry by a translation vector. On a sketch created with `planeId` the move runs through the constraint solver: connected/constrained geometry follows (moving the right side of a rectangle +10 stretches the top and bottom lines to 90). Without a plane it is a raw translation.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- Existing geometry to move (points, lines, circles, arcs)

## Key Parameters

- `id` — sketch ID (required, type "sketch")
- `geomIds` — array of sketch geometry IDs to move. Accepted types: `["sketch-curve", "sketch-point"]`. All specified items receive the same translation.
- `translation` — `[x, y, z]` vector. **Z must be 0** — the server validates this as a 2D point and rejects non-zero Z with error 1014.

## Return Value

Returns a number (0 or 1) representing the ClassCAD boolean for "sketch is still solved":
- `1` — constraints are satisfied after the move
- `0` — constraints are broken (e.g., fixation constraints no longer match positions)

In practice the return value is unreliable as a logic signal — it depends on internal solver state. Use it as a hint that constraints may need attention, not as a definitive check.

maxLevel=31 on success, 51 on error.

## Gotchas

- **Constraint-aware (sketch with `planeId`).** Moving one side of a rectangle drags the connected sides; a move that conflicts with constraints returns maxLevel 51 and leaves geometry unchanged. This differs from `updateGeometry`, which sets positions without solving. To move a rectangle as a unit, pass ALL 4 line IDs in `geomIds`.
- **Z must be exactly 0.** Even though `translation` is typed as `point` ([x,y,z]), the Z component must be 0. Non-zero Z triggers error 1014: `"translation" which is a 2D point, must have a z-value of 0!`
- **Empty geomIds is a no-op.** Passing `[]` returns result=0, maxLevel=31, no error.
- **All geometry types work.** Points, lines, circles, arcs (both arcByCenter and arcBy3Points) all move correctly. For arcs, all control points (start, end, center) are translated uniformly.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `wrong id type! Provide only following id types: ["sketch"]` | `id` is not a sketch (e.g., passed a part ID) |
| 1001 | ERROR | `wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | Non-geometry ID in `geomIds` (e.g., sketch ID, part ID) |
| 1006 | ERROR | `invalid id` | Geometry ID doesn't exist |
| 1014 | ERROR | `"translation" which is a 2D point, must have a z-value of 0!` | Non-zero Z in translation |

## Usage Hints

- **To move a group as a rigid body**, pass all item IDs in `geomIds`. The server applies the same translation to every item in one operation.
- **Negative translations work fine.** `[-30, -20, 0]` moves left and down.
- **Zero translation is a safe no-op.** `[0, 0, 0]` does nothing, no error.
- **Prefer moveGeometry over updateGeometry for translations.** moveGeometry is simpler — you specify the delta, not absolute positions. Use updateGeometry when you need to set exact positions.
- **Works with all creation methods.** Geometry from `sketch.line`, `sketch.circle`, `sketch.geometry` batch, `sketch.rectangle` — all movable.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0] })).result
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 15 })).result

// Move both by [20, 15, 0]
const r = await api.v1.sketch.moveGeometry({
  id: skId,
  geomIds: [lineId, circId],
  translation: [20, 15, 0],
})
// r.result → 0 or 1 (solved state)
// Line now at [30,25]-[70,25], circle center now at [50,45]
```

### Moving a rectangle as a unit

```js
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0],
})).result
// rectIds = [line1, line2, line3, line4]

// MUST pass all 4 lines to keep the rectangle intact
await api.v1.sketch.moveGeometry({
  id: skId,
  geomIds: rectIds,
  translation: [20, 10, 0],
})
```

## Related

`sketch.updateGeometry` · `sketch.getPositions` · `sketch.geometry`
