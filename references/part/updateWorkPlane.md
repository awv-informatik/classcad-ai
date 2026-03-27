# part.updateWorkPlane

Modifies an existing work plane feature. Only the parameters you provide are changed — omitted parameters keep their current values.

## Prerequisites

- A work plane feature (from `part.workPlane`)
- The work plane ID (not the part ID)
- **Must be wrapped in `openFeature` / `closeFeature`** — this is not optional

## The Pattern

```js
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({ id: wpId, offset: 50 })
await api.v1.part.closeFeature({ id: wpId })
```

Calling `updateWorkPlane` without `openFeature` produces: "The provided feature is not allowed to update. It's not active and open."

## Key Parameters

- **`id`** (required) — the work plane feature ID (from `workPlane` result or `getWorkGeometry`). NOT the part ID.
- **`name`** — rename the feature. Old name stops resolving via `getWorkGeometry`.
- **`type`** — change the plane type. When switching to a referenced type, provide matching `references`.
- **`references`** — new reference IDs. Required when changing to a referenced type.
- **`offset`** — new offset distance along normal.
- **`angle`** — new angle for LINEPLANEANGLE type. Accepts radians or expression strings (`'45deg'`).
- **`position`** — new center position (USERDEFINED only).
- **`normal`** — new normal vector (USERDEFINED only).

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the same work plane ID on success (maxLevel 31). Returns ID with maxLevel 51 on failure.

## Gotchas

- **openFeature/closeFeature is mandatory.** Without it, every call fails. This is the #1 mistake.
- **`id` is the work plane ID, not the part ID.** Passing the part ID gives: "not a feature or work geometry id."
- **Changing type without references creates a broken feature.** E.g., switching to PLANE without `references` sets maxLevel 51 ("missing references") but the feature persists in a broken state.
- **Built-in planes (Top/Front/Right) cannot have geometry modified.** Offset, normal, and position changes are blocked: "WorkGeometry created by the system cannot be changed!" However, **renaming built-ins works** — the name change takes effect despite maxLevel 51.
- **Multiple updates in one open session work.** Call `updateWorkPlane` multiple times between `openFeature` and `closeFeature` — each call takes effect. Only one `closeFeature` needed.
- **No-op update (only `id`) returns maxLevel 51.** Always provide at least one property to change.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "not active and open" | Missing `openFeature` | Wrap in `openFeature`/`closeFeature` |
| "id must be provided for update" | Missing `id` param | Pass the work plane feature ID |
| "not a feature or work geometry id" | Part ID passed instead of WP ID | Use the ID from `workPlane` or `getWorkGeometry` |
| "missing references" | Changed type without matching refs | Provide `references` when changing to a referenced type |
| "cannot be changed" | Trying to modify built-in geometry | Don't modify built-in plane geometry; rename is OK |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const wpId = (await api.v1.part.workPlane({
  id: partId, name: 'WP1', normal: [0, 0, 1]
})).result

// Update offset
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({ id: wpId, offset: 50 })
await api.v1.part.closeFeature({ id: wpId })

// Change type to PLANE with reference
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({
  id: wpId,
  type: 'PLANE',
  references: [topId],
  offset: 30
})
await api.v1.part.closeFeature({ id: wpId })

// Multiple updates in one session
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPlane({ id: wpId, name: 'WP_renamed' })
await api.v1.part.updateWorkPlane({ id: wpId, offset: 100 })
await api.v1.part.closeFeature({ id: wpId })
```

## Related

- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.workPlane` — create work planes
- `part.getWorkGeometry` — find work plane by name
