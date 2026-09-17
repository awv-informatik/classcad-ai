# sketch.undoFillet

Removes a fillet arc and restores the sharp corner — inverse of `sketch.fillet`.

## Key Parameters

- `id` — the sketch containing the fillet
- `arcId` — first element of the `fillet` result tuple; must be a `sketch-arc` ID

## Return Value

VOID (null), maxLevel=31, no messages on success.

## Behavior

- Removes the arc and its points (controlPoint, startPoint, endPoint).
- Restores the lines to pre-fillet extent, **same line IDs**.
- Other geometry and other fillets are untouched; undo any subset in any order (FIFO/LIFO both fine).
- Works on all fillet types: negative-offset (exterior), acute/obtuse angles, manually drawn lines.
- Re-filleting after undo produces fresh IDs (old ones not reused).

## Common Errors

| Error message | Cause | Code |
|---|---|---|
| "An element of parameter 'arcId' has an invalid id!" | arcId already undone (double undo) or nonexistent | 1006 |
| "The parameter 'arcId' has a wrong id type! Provide only following id types: ['sketch-arc']" | Non-arc ID (line, sketch, part, …) | 1001 |
| "Arc start/end points should have exactly one coincident point each!" | `id` is a different sketch than the arc's | 0 |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UndoDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })).result

const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 10 })
await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[2], lineIds[3]], radius: 10 })

await api.v1.sketch.undoFillet({ id: skId, arcId: f1.result[0] }) // second fillet remains
const f3 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 20 }) // new IDs
```

## Related

`sketch.fillet` · `sketch.rectangle`
