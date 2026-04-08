# sketch.deleteSketch

Deletes one or more sketches by their IDs.

## Prerequisites

- Existing sketch IDs (`sketch.create` or `part.sketch`)

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
- **All-or-nothing on mixed IDs.** If any ID in the array is invalid, **no sketches are deleted** — not even the valid ones. The entire operation aborts. This is not partial success.
- **Deletion is immediate.** After deletion, `part.getSketch` for that sketch name returns null with error 1015.
- **Removes all 3 internal objects.** The `CC_Sketch`, `CC_SketchReference`, and `CC_SketchDimensionSet` nodes are all removed from the structure tree.
- **Sketch geometry is deleted too.** Lines, circles, rectangles, constraints — everything inside the sketch is removed.
- **Dependent features become broken, not deleted.** If the sketch was used by a feature (e.g., extrusion), the feature node persists in the tree but errors on re-evaluation ("CCObject can not be opened"). The solid geometry remains as stale mesh data but cannot be regenerated. maxLevel=51 is returned with error messages.
- **Wrong ID type gives code 1001.** Passing a part ID or other non-sketch ID gives "wrong id type! Provide only following id types: ['sketch']" — different from the 1006 "invalid id" error for nonexistent IDs.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "invalid id" | 1006 | Non-existent or already-deleted sketch ID |
| "wrong id type" | 1001 | ID exists but is not a sketch (e.g., part ID, negative number) |
| "parameter 'ids' must be provided" | 1004 | `ids` param omitted entirely |
| "string couldn't be converted to an id" | 0 (warning) | String value passed instead of numeric ID |

## deleteObject vs deleteSketch

`sketch.deleteObject` cannot delete whole sketches. It only handles sub-sketch items: dimensions, sketch-curves, sketch-points, 2D constraints, sketch regions. To delete entire sketches, use `deleteSketch`.

## Working Example

```js
// Delete single
await api.v1.sketch.deleteSketch({ ids: [sketchId] })

// Delete multiple (all-or-nothing — all must be valid)
await api.v1.sketch.deleteSketch({ ids: [sk1, sk2, sk3] })

// Safe pattern: validate before bulk delete
const ids = [sk1, sk2, sk3]
for (const id of ids) {
  await api.v1.sketch.deleteSketch({ ids: [id] })
}
```

## Related

- `sketch.create` / `part.sketch` — create sketches
- `sketch.deleteObject` — delete sub-sketch items (geometry, constraints, dimensions)
- `part.getSketch` — verify sketch exists before/after deletion
