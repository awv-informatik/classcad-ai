# sketch.fillet

Replaces the sharp corner of two connected sketch lines with a fillet arc. Reverse with `sketch.undoFillet`.

## Key Parameters

- `id` — sketch ID
- `lineIds` — exactly 2 `sketch-line` IDs sharing an incident point; arcs, circles, etc. → 1001. Rectangle lines are inherently connected; separate `sketch.line` calls meeting at one coordinate also work (auto-coincidence joins them). Same coordinates alone without a shared point object may not count as connected.
- `offset` — distance from the incidence point to arc start/end. Must be > 0 (zero → "Invalid arc parameters", maxLevel 51) and smaller than both line lengths. **Silently overrides `radius`** if both set. **Negative = exterior fillet:** lines are extended past the intersection and the arc joins them outside; absolute value sets the size.
- `radius` — arc radius (> 0); ignored when `offset` is set.
- Neither set → `offset = 1/4 * shortest_line_length`.

## Return Value

`[arcId, controlPointId, startPointId, endPointId]`; `null` (VOID) on failure.

- `arcId` — pass to `undoFillet`
- `controlPointId` — center/control point (red dot in renderer)
- `startPointId` / `endPointId` — where the arc meets the first / second trimmed line

## Gotchas

- **Same pair can't be filleted twice** — the arc separates the lines: "Lines don't have incident points!"
- **undoFillet** ([undoFillet.md](undoFillet.md)): `sketch.undoFillet({ id, arcId })` → VOID, maxLevel 31; restores full-length lines (same IDs); undos are independent and order-free; re-filleting gives new IDs.

## Common Errors

| Error message | Cause |
|---|---|
| "Lines don't have incident points!" | Not connected, or already filleted |
| "Can't create a fillet with offset larger than line length!" | Offset exceeds a line length |
| "Invalid arc parameters" | Zero offset or radius |
| "wrong id type! Provide only following id types: ['sketch-line']" | Non-line ID (1001) |
| "parameter 'arcId' has an invalid id!" | Invalid arcId for undoFillet (1006) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })).result

const [arcId] = (await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })).result
await api.v1.sketch.undoFillet({ id: skId, arcId })

for (let i = 0; i < 4; i++) {
  await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[i], lineIds[(i + 1) % 4]], radius: 8 })
}
```

## Related

`sketch.line` · `sketch.rectangle` · `sketch.constraint`
