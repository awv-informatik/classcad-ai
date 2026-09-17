# sketch.updateGeometry

Updates existing sketch geometry in place. A **raw position setter** — does NOT trigger the constraint solver.

## Key Parameters

- `id` (required) — must be a sketch (part ID → 1001), but geometry ownership is NOT checked: items are updated by their own IDs regardless of which sketch you pass.
- `points` — `[{ id, pos }]`
- `lines` — `[{ id, startPos, endPos }]`
- `circles` — `[{ id, centerPos, radius }]`
- `arcsBy3Points` — `[{ id, startPos, endPos, midPos }]`
- `arcsByCenter` — `[{ id, startPos, endPos, centerPos, isClockwise? }]` (isClockwise default TRUE)
- `isConstruction` on lines/circles/arcs (not points) — toggles construction status both ways, e.g. `lines: [{ id, isConstruction: true }]`. See `recipes/constrained-sketching` (§ Construction geometry).

All arrays optional; mix types and multiple items per type in one call. Empty calls are a no-op (maxLevel 31).

**Partial updates work** — pass only what changes: `circles: [{ id, radius: 9 }]` keeps the center, `lines: [{ id, endPos }]` keeps the start.

## Return Value

VOID (null). maxLevel 31 on success, 51 on failure.

## Gotchas

- **Constraints are NOT enforced.** Moving one endpoint of a constrained rectangle does NOT drag connected lines. To resize/move connected geometry (e.g. a rectangle), update ALL affected items in one call with consistent positions.
- **Coincident points are separate IDs.** Moving one via `updateGeometry` does NOT move the other — they become non-coincident until the solver runs.
- **`getPositions` returns null for circles** — track center/radius yourself.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` | Top-level `id` not a sketch |
| 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch-circle"]` | Wrong geometry type in array (e.g. line ID in `circles`) |
| 1004 | `The parameter "X" must be provided in the api call!` | Missing required property |
| 1006 | `An element of parameter "id" has an invalid id!` | Geometry ID doesn't exist |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const geo = await api.v1.sketch.geometry({
  id: skId,
  lines: [
    { startPos: [0, 0, 0], endPos: [60, 0, 0] },
    { startPos: [60, 0, 0], endPos: [60, 40, 0] },
  ],
  circles: [{ centerPos: [30, 20, 0], radius: 10 }],
  genFixation: false,
})
const [line1, line2] = geo.result.lines
const [circ] = geo.result.circles

await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [
    { id: line1, startPos: [0, 0, 0], endPos: [80, 0, 0] },
    { id: line2, startPos: [80, 0, 0], endPos: [80, 60, 0] },
  ],
  circles: [{ id: circ, centerPos: [40, 30, 0], radius: 15 }],
})
await api.v1.sketch.updateGeometry({ id: skId, lines: [{ id: line1, isConstruction: true }] })
```

## Related

`sketch.geometry` · `sketch.getPositions` · `sketch.getPoints` · `sketch.moveGeometry`
