# sketch.undoFillet

Removes a fillet arc and reconnects the original lines, restoring the sharp corner. The inverse of `sketch.fillet`.

## Prerequisites

- A sketch with an existing fillet created by `sketch.fillet`
- The `arcId` from the fillet's return tuple (first element)

## Key Parameters

- `id` — sketch ID (must be the sketch containing the fillet)
- `arcId` — the arc ID returned as the first element of the `fillet` result tuple. Must be a `sketch-arc` type ID.

## Return Value

Returns VOID (`null`), maxLevel=31 on success. No messages on success.

## Behavior

- **Removes the fillet arc and its associated points** (controlPoint, startPoint, endPoint) from the sketch.
- **Restores original lines to their pre-fillet extent.** The same line IDs are preserved — lines are trimmed during fillet but restored to full length on undo.
- **Other sketch geometry is untouched.** Additional lines, arcs, circles, etc. in the same sketch are not affected.
- **Each undo is independent.** On a multi-filleted sketch, undoing one fillet does not affect others. You can selectively undo any subset of fillets.
- **Order does not matter.** FIFO and LIFO both work. There is no required undo sequence.

## Gotchas

- **Double undo fails.** After the first undo, the arcId becomes invalid. A second `undoFillet` with the same arcId produces error code 1006: "An element of parameter 'arcId' has an invalid id!"
- **Wrong sketch ID fails.** The `id` must be the sketch that contains the fillet arc. Passing a different sketch ID produces: "Arc start/end points should have exactly one coincident point each!"
- **Only `sketch-arc` IDs accepted.** Passing a line ID, sketch ID, part ID, or any non-arc ID fails with code 1001: "The parameter 'arcId' has a wrong id type! Provide only following id types: ['sketch-arc']"
- **After undo, re-filleting produces new IDs.** The original fillet IDs are not reused. Each fillet/undo/refillet cycle generates fresh IDs.
- **Works on all fillet types.** Negative-offset (exterior) fillets, fillets on acute/obtuse angles, and fillets on manually-drawn lines (not just rectangles) can all be undone.

## Common Errors

| Error message | Cause | Code |
|---|---|---|
| "An element of parameter 'arcId' has an invalid id!" | arcId was already undone or doesn't exist | 1006 |
| "The parameter 'arcId' has a wrong id type! Provide only following id types: ['sketch-arc']" | Passed a non-arc ID (line, sketch, part, etc.) | 1001 |
| "Arc start/end points should have exactly one coincident point each!" | Wrong sketch ID — arc belongs to a different sketch | 0 |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UndoDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
const lineIds = rect.result

// Fillet two corners
const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 10 })
const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[2], lineIds[3]], radius: 10 })

// Undo just the first fillet — second remains
await api.v1.sketch.undoFillet({ id: skId, arcId: f1.result[0] })

// Re-fillet with different params
const f3 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 20 })
// f3.result has new IDs, not the same as f1.result
```

## Related

- `sketch.fillet` — creates the fillet that this API undoes
- `sketch.rectangle` — creates connected lines suitable for filleting
