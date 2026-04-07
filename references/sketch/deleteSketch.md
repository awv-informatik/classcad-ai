# sketch.deleteSketch

Deletes one or more sketches by their IDs.

## Prerequisites

- Existing sketch IDs (`sketch.create`)

## Key Parameters

- **`ids`** (required) — array of sketch IDs to delete. Can be a single ID `[skId]` or multiple `[sk1, sk2, sk3]`.

## Return Value

```js
{ result: null (VOID), messages?: [...], maxLevel?: real }
```

Returns VOID on success. maxLevel=31.

## Gotchas

- **Empty array is a no-op.** `ids: []` succeeds silently (maxLevel=31, no error). Does nothing.
- **Invalid/already-deleted IDs produce errors.** maxLevel=51, error code 1006. You get both a warning (41, "ToId() didn't get valid id") and an error (51, "invalid id").
- **Deletion is immediate.** After deletion, `part.getSketch` for that sketch name returns null with error.
- **Removes all 3 internal objects.** The `CC_Sketch`, `CC_SketchReference`, and `CC_SketchDimensionSet` nodes are all removed.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "invalid id" | 1006 | Non-existent or already-deleted sketch ID |

## Working Example

```js
// Delete single
await api.v1.sketch.deleteSketch({ ids: [sketchId] })

// Delete multiple
await api.v1.sketch.deleteSketch({ ids: [sk1, sk2, sk3] })
```

## Related

- `sketch.create` — create sketches
- `part.getSketch` — verify sketch exists before/after deletion
