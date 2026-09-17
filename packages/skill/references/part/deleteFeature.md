# part.deleteFeature

Permanently deletes features, work geometries, and sketches from a part.

## Key Parameters

- `ids` (required) — array of IDs of type `feature`, `workgeometry`, or `sketch`; types can be mixed in one call.

## Return Value

VOID (null). Check `maxLevel`:
- **31** — all deleted successfully
- **51** — error: either bad IDs (nothing deleted) or downstream dependency breakage (deletion happened, dependents broke)

## Atomicity

- **Invalid IDs → all-or-nothing.** If any element of `ids` is invalid or nonexistent, the call is rejected and NOTHING is deleted — valid IDs in the same array are preserved. Validate IDs first.
- **Valid IDs that break dependents → not rolled back.** The deletion proceeds; maxLevel 51 reflects the broken dependents.

## Dependency Behavior

- **Deleting a boolean operand** (target OR tool) — the operand is deleted; the boolean breaks with error 1111 ("unrecognized ID as an entity for Subtraction") and remains in the tree, degenerate.
- **Deleting a boolean itself** — clean success. Target and tool are restored as separate independent bodies with their original IDs.
- **Safe order:** delete the boolean FIRST, then its operands. Never delete operands while the boolean exists.

## Gotchas

- **Don't delete the feature you have open.** Deleting an unrelated feature while another is open works (open box → delete cylinder → close box: all maxLevel 31).
- **Rolled-back features CAN be deleted — but with errors.** On a feature behind the rollback bar it produces internal errors (maxLevel 51, "Index N ausserhalb des Arraybereichs") BUT the feature is still permanently removed. Dangerous — misleading errors, model state may be inconsistent. Always `operationMoveToEnd` before deleting.
- **Built-in origin geometry CAN be deleted** (Top, Front, Right planes; X/Y/Z axes). Downstream features referencing it will break.
- **Double-delete fails** with error 1006 ("invalid id") — the ID ceases to exist after the first deletion.
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
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 60 })).result
const boolId = (await api.v1.part.boolean({ id: partId, type: 'UNION', target: boxId, tools: [cylId] })).result

// Safe boolean cleanup: delete boolean first (restores box + cyl as separate bodies)...
await api.v1.part.deleteFeature({ ids: [boolId] })
// ...then both operands in one call
const r = await api.v1.part.deleteFeature({ ids: [boxId, cylId] })
// r.result = null (VOID), r.maxLevel = 31
```

## Related

`part.getFeature` · `part.operationMoveBefore` · `part.openFeature` / `part.closeFeature`
