# part.deleteFeature

Permanently deletes features, work geometries, and sketches from a part. Accepts multiple IDs in one call. Deletion is atomic — if any ID is invalid, nothing is deleted.

## Prerequisites

- A part with features, work geometry, or sketches to delete
- Valid IDs of type `feature`, `workgeometry`, or `sketch`

## Key Parameters

- `ids` (required) — array of IDs to delete. Accepts feature, work geometry, and sketch IDs. Can mix types in one call.

## Return Value

Returns VOID (null). Check `maxLevel`:
- **31** — all features deleted successfully
- **51** — error. Either bad IDs (nothing deleted) or downstream dependency breakage (deletion happened but dependents broke)

## Atomicity

The call is **all-or-nothing when IDs are invalid**. If any element in the `ids` array is an invalid or nonexistent ID, the entire call is rejected and NO features are deleted. Valid IDs in the same array are preserved.

However, when IDs are valid but deletion breaks downstream features (e.g., deleting a boolean operand), the deletion proceeds and maxLevel 51 reflects the broken dependents — not a rollback.

## Dependency Behavior

- **Deleting a boolean operand** (target OR tool) — the operand is deleted, the boolean breaks with error 1111 ("unrecognized ID as an entity for Subtraction"). The boolean feature remains in the tree but is degenerate.
- **Deleting a boolean itself** — clean success. Both target and tool are restored as separate independent bodies with their original IDs.
- **Safe deletion order:** delete the boolean FIRST, then delete its operands. Never delete operands while the boolean exists.

## Gotchas

- **Atomic on invalid IDs.** One bad ID in the array prevents ALL deletions. Validate IDs first.
- **NEVER delete during openFeature/closeFeature.** Deleting ANY feature (even unrelated ones) while inside an editing session corrupts the context. `closeFeature` will fail with error 1001 afterward. Always close the editing session first.
- **Rolled-back features CAN be deleted** — but with errors. deleteFeature on a feature behind the rollback bar produces internal errors (maxLevel 51, "Index N ausserhalb des Arraybereichs") BUT the feature is still permanently removed. This is dangerous — the errors are misleading and the model state may be inconsistent. Always `operationMoveToEnd` before deleting.
- **Built-in origin geometry CAN be deleted.** Top, Front, Right planes and X/Y/Z axes are deletable. Be careful — downstream features referencing origin geometry will break.
- **Double-delete fails.** Deleting an already-deleted feature gives error 1006 ("invalid id") — the ID ceases to exist after first deletion.
- **Empty `ids: []` is a no-op**, not an error (maxLevel 31).

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1006 | "An element of parameter \"ids\" has an invalid id!" | Nonexistent, zero, or already-deleted ID |
| 1001 | "wrong id type — provide only: [feature, workgeometry, sketch]" | Passed a part ID or other wrong type |
| 1004 | "must be provided in the api call!" | `ids` parameter omitted |
| 1111 | "There is unrecognized ID as an entity for X" | Deleted feature was referenced by a downstream feature |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60 })).result

// Delete both features in one call
const r = await api.v1.part.deleteFeature({ ids: [boxId, cylId] })
// r.result = null (VOID), r.maxLevel = 31

// Safe boolean cleanup: delete boolean first, then operands
const boolId = (await api.v1.part.boolean({ id: partId, type: 'UNION', target: boxId, tools: [cylId] })).result
await api.v1.part.deleteFeature({ ids: [boolId] })    // restores box + cyl as separate bodies
await api.v1.part.deleteFeature({ ids: [boxId, cylId] }) // now safe to delete operands
```

## Related

- `part.getFeature` — find feature ID by name (pair with deleteFeature to delete by name)
- `part.operationMoveBefore` — hide features without deleting (reversible alternative)
- `part.openFeature` / `part.closeFeature` — editing gate. Never delete while open.
