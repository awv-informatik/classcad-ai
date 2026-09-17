# part.updateWorkPlane

Modifies an existing work plane. Only provided parameters change. **Must be wrapped in `openFeature` / `closeFeature`** — without it every call fails with "The provided feature is not allowed to update. It's not active and open." (the #1 mistake).

## Key Parameters

- **`id`** (required) — work plane feature ID (from `workPlane` or `getWorkGeometry`), NOT the part ID
- **`name`** — rename; the old name stops resolving via `getWorkGeometry`
- **`type`** — change type
- **`references`** — required when changing to a referenced type
- **`offset`** — distance along normal
- **`angle`** — LINEPLANEANGLE; radians or expression string (`'45deg'`)
- **`position`** / **`normal`** — USERDEFINED only

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Same work plane ID; maxLevel 31 on success, 51 on failure.

## Gotchas

- **Changing type without references creates a broken feature** — e.g. to PLANE without `references`: maxLevel 51 ("missing references"), feature persists broken.
- **Built-in planes (Top/Front/Right): geometry can't be modified** — offset/normal/position changes fail with "WorkGeometry created by the system cannot be changed!" **Renaming built-ins works** — takes effect despite maxLevel 51.
- **Multiple updates in one open session work** — each call takes effect; one `closeFeature`.
- **No-op update** (only `id`) returns maxLevel 31.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "not active and open" | Missing `openFeature` | Wrap in `openFeature`/`closeFeature` |
| "id must be provided for update" | Missing `id` param | Pass the work plane feature ID |
| "not a feature or work geometry id" | Part ID passed instead of WP ID | Use the ID from `workPlane` or `getWorkGeometry` |
| "missing references" | Changed type without matching refs | Provide `references` when changing to a referenced type |
| "cannot be changed" | Modifying built-in plane geometry | Don't; rename is OK |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', normal: [0, 0, 1] })).result

// Multiple updates in one session
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({ id: wpId, offset: 50 })
await api.v1.part.updateWorkPlane({ id: wpId, name: 'WP_renamed' })
await api.v1.part.closeFeature({ id: wpId })

// Change type to PLANE with reference
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({ id: wpId, type: 'PLANE', references: [topId], offset: 30 })
await api.v1.part.closeFeature({ id: wpId })
```

## Related

`part.openFeature` / `part.closeFeature` · `part.workPlane` · `part.getWorkGeometry`
