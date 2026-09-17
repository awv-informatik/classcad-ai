# part.updateWorkAxis

Modifies an existing work axis. Only provided parameters change. **Must be wrapped in `openFeature` / `closeFeature`** — without it every call fails with "The provided feature is not allowed to update. It's not active and open." (the #1 mistake).

## Key Parameters

- **`id`** (required) — work axis feature ID (from `workAxis` or `getWorkGeometry`), NOT the part ID
- **`name`** — rename; the old name stops resolving via `getWorkGeometry`
- **`type`** — change type; for a referenced type also pass matching `references`
- **`references`** — new reference IDs. Can be passed alone — the type is kept (e.g. a CURVE axis switches which edge it follows).
- **`position`** / **`direction`** — USERDEFINED only. Numeric array, or string vector with expressions: `'[@expr.X, 5, 0]'`.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Same work axis ID; maxLevel 31 on success, 51 on failure.

## Gotchas

- **Only one feature can be open at a time.** Forgetting `closeFeature` blocks opening another: "There is still an open feature, please commit or decline the feature first."
- **Built-in axes (XAxis/YAxis/ZAxis): geometry can't be modified** — direction/position changes fail with "WorkGeometry created by the system cannot be changed!" **Renaming built-ins works** — takes effect despite maxLevel 51.
- **Changing type without references creates a broken feature** — e.g. to 2PLANES without `references`: maxLevel 51 ("missing references"), feature persists broken. Recoverable by switching back to USERDEFINED.
- **Multiple updates in one open session work** — each call takes effect; one `closeFeature`.
- **No-op update** (only `id`) returns maxLevel 31.
- **`getExpression` does not work on work axes** — returns null; position/direction can't be read back programmatically.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "not active and open" | Missing `openFeature` | Wrap in `openFeature`/`closeFeature` |
| "id must be provided for update" | Missing `id` param | Pass the work axis feature ID |
| "not a feature or work geometry id" | Part ID passed instead of WA ID | Use the ID from `workAxis` or `getWorkGeometry` |
| "feature id does not exist" | Non-existent ID | Check the ID is valid |
| "missing references" | Changed type without matching refs | Provide `references` when changing to a referenced type |
| "cannot be changed" | Modifying built-in axis geometry | Don't; rename is OK (but reports error) |
| "still an open feature" | Forgot `closeFeature` before opening another | Close the current feature first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
// Reference geometry must exist before the axis (openFeature rolls the tree back to it)
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const faces = (await api.v1.part.getGeometryIds({
  id: partId,
  planes: [{ positions: [[40, 30, 40]] }, { positions: [[40, 0, 20]] }, { positions: [[80, 30, 20]] }], // top, front, right
})).result.planes
const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', direction: [1, 0, 0] })).result

// Multiple updates in one session
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 0, 1] })
await api.v1.part.updateWorkAxis({ id: waId, name: 'WA_renamed', position: [50, 50, 50] })
await api.v1.part.closeFeature({ id: waId })

// Change type to 2PLANES
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, type: '2PLANES', references: [faces[0], faces[1]] })
await api.v1.part.closeFeature({ id: waId })

// References only (type stays 2PLANES)
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, references: [faces[0], faces[2]] })
await api.v1.part.closeFeature({ id: waId })
```

## Related

`part.openFeature` / `part.closeFeature` · `part.workAxis` · `part.getWorkGeometry`
