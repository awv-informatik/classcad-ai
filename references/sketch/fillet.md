# sketch.fillet

Creates a fillet arc at the intersection of two connected sketch lines, replacing the sharp corner with a smooth arc. Also covers `sketch.undoFillet` which reverses the operation.

## Prerequisites

- A sketch (`sketch.create`)
- Two `sketch-line` elements that share an incident point (connected at a corner)

## Key Parameters

- `id` — sketch ID
- `lineIds` — array of exactly 2 line IDs. Must be `sketch-line` type — arcs, circles, and other sketch elements are rejected (error code 1001).
- `offset` — distance from the incidence point to the arc start/end. Takes precedence over `radius` if both are set. Must be > 0 and smaller than both line lengths.
- `radius` — radius of the fillet arc. Ignored if `offset` is also set.
- If neither `offset` nor `radius` is set, defaults to `offset = 1/4 * shortest_line_length`.

## Return Value

Returns an array of 4 IDs: `[arcId, controlPointId, startPointId, endPointId]`

- `arcId` — the fillet arc element. Pass this to `undoFillet` to remove the fillet.
- `controlPointId` — the center/control point of the arc (visible as a red dot in the renderer).
- `startPointId` — point where the arc meets the first trimmed line.
- `endPointId` — point where the arc meets the second trimmed line.

Returns `null` (VOID) on failure.

## Gotchas

- **`offset` silently overrides `radius`.** If you pass both, `radius` is ignored with no warning.
- **Zero offset or radius is an error.** Produces "Invalid arc parameters" (maxLevel=51). Must be > 0.
- **Offset must not exceed line length.** Clear error: "Can't create a fillet with offset larger than line length!"
- **Lines must share an incident point.** Two separate lines at the same coordinate position may not be "connected" — they need to share the same point object. Rectangle lines are inherently connected. Separate `sketch.line` calls with matching coordinates may work if the sketcher auto-merges the points (tested and confirmed), but this is less reliable than lines from a single geometric operation.
- **Cannot fillet the same pair twice.** After filleting, the original lines no longer share a point (the arc separates them). A second fillet on the same line IDs fails with "Lines don't have incident points!"
- **Only `sketch-line` IDs accepted.** Passing arc, circle, or other sketch element IDs fails with error code 1001.
- **Negative offset creates an exterior fillet.** Instead of rounding the corner inward, the lines are extended beyond their intersection and the arc connects them on the outside. The absolute value determines the size.

## undoFillet

See **[undoFillet.md](undoFillet.md)** for full documentation. Key facts:

- `sketch.undoFillet({ id, arcId })` — pass the `arcId` from the fillet result tuple (first element).
- Returns VOID (null), maxLevel=31 on success.
- Restores original lines to full length (same line IDs preserved).
- Each undo is independent — order doesn't matter on multi-filleted sketches.
- After undo, re-filleting produces new IDs (not the originals).

## Common Errors

| Error message | Cause |
|---|---|
| "Lines don't have incident points!" | Lines are not connected, or already filleted |
| "Can't create a fillet with offset larger than line length!" | Offset exceeds one of the line lengths |
| "Invalid arc parameters" | Zero offset or radius |
| "wrong id type! Provide only following id types: ['sketch-line']" | Passed non-line ID in lineIds (code 1001) |
| "parameter 'arcId' has an invalid id!" | Invalid arc ID for undoFillet (code 1006) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
const lineIds = rect.result // [line0, line1, line2, line3]

// Fillet one corner with offset
const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
const [arcId, controlPtId, startPtId, endPtId] = f.result

// Undo the fillet
await api.v1.sketch.undoFillet({ id: skId, arcId })

// Fillet all 4 corners with radius
for (let i = 0; i < 4; i++) {
  await api.v1.sketch.fillet({
    id: skId,
    lineIds: [lineIds[i], lineIds[(i + 1) % 4]],
    radius: 8
  })
}
```

## Related

- `sketch.line` — creates lines to fillet
- `sketch.rectangle` — creates connected lines (good fillet target)
- `sketch.constraint` — fillet implicitly adds tangent constraints
