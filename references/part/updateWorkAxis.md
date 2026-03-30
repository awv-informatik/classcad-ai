# part.updateWorkAxis

Modifies an existing work axis feature. Only the parameters you provide are changed — omitted parameters keep their current values.

## Prerequisites

- A work axis feature (from `part.workAxis`)
- The work axis ID (not the part ID)
- **Must be wrapped in `openFeature` / `closeFeature`** — this is not optional

## The Pattern

```js
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 1, 0] })
await api.v1.part.closeFeature({ id: waId })
```

Calling `updateWorkAxis` without `openFeature` produces: "The provided feature is not allowed to update. It's not active and open."

## Key Parameters

- **`id`** (required) — the work axis feature ID (from `workAxis` result or `getWorkGeometry`). NOT the part ID.
- **`name`** — rename the feature. Old name stops resolving via `getWorkGeometry`.
- **`type`** — change the axis type. When switching to a referenced type, provide matching `references`.
- **`references`** — new reference IDs. Can be updated alone without re-specifying type — the axis retains its current type.
- **`position`** — new position (USERDEFINED only). Numeric array only, no expressions.
- **`direction`** — new direction vector (USERDEFINED only). Numeric array only, no expressions.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the same work axis ID on success (maxLevel 31). Returns the ID with maxLevel 51 on failure.

## Gotchas

- **openFeature/closeFeature is mandatory.** Without it, every call fails. This is the #1 mistake.
- **`id` is the work axis ID, not the part ID.** Passing the part ID gives: "not a feature or work geometry id."
- **Only one feature can be open at a time.** Forgetting `closeFeature` blocks opening any other feature: "There is still an open feature, please commit or decline the feature first."
- **Built-in axes (XAxis/YAxis/ZAxis) cannot have geometry modified.** Direction and position changes are blocked: "WorkGeometry created by the system cannot be changed!" However, **renaming built-ins works** — the name change takes effect despite maxLevel 51.
- **Changing type without references creates a broken feature.** E.g., switching to 2PLANES without `references` sets maxLevel 51 ("missing references") but the feature persists in a broken state. Recoverable by switching back to USERDEFINED.
- **Multiple updates in one open session work.** Call `updateWorkAxis` multiple times between `openFeature` and `closeFeature` — each call takes effect. Only one `closeFeature` needed.
- **No-op update is harmless.** Calling with only `id` returns maxLevel 31 (success, no error).
- **`getExpression` does not work on work axes.** Returns null. Cannot read back position/direction values programmatically.
- **Can update references without re-specifying type.** A CURVE axis can switch which edge it follows by passing only `references` — the type stays CURVE.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "not active and open" | Missing `openFeature` | Wrap in `openFeature`/`closeFeature` |
| "id must be provided for update" | Missing `id` param | Pass the work axis feature ID |
| "not a feature or work geometry id" | Part ID passed instead of WA ID | Use the ID from `workAxis` or `getWorkGeometry` |
| "feature id does not exist" | Non-existent ID | Check the ID is valid |
| "missing references" | Changed type without matching refs | Provide `references` when changing to a referenced type |
| "cannot be changed" | Trying to modify built-in axis geometry | Don't modify built-in axis geometry; rename is OK (but reports error) |
| "still an open feature" | Forgot `closeFeature` before opening another | Close the current feature first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const waId = (await api.v1.part.workAxis({
  id: partId, name: 'WA1', direction: [1, 0, 0]
})).result

// Update direction
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 0, 1] })
await api.v1.part.closeFeature({ id: waId })

// Change type to 2PLANES with references
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({
  id: waId,
  type: '2PLANES',
  references: [faceId1, faceId2]
})
await api.v1.part.closeFeature({ id: waId })

// Multiple updates in one session
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, name: 'WA_renamed' })
await api.v1.part.updateWorkAxis({ id: waId, position: [50, 50, 50] })
await api.v1.part.closeFeature({ id: waId })

// Update references only (type stays the same)
await api.v1.part.openFeature({ id: waId })
await api.v1.part.updateWorkAxis({ id: waId, references: [newEdgeId] })
await api.v1.part.closeFeature({ id: waId })
```

## Related

- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.workAxis` — create work axes
- `part.getWorkGeometry` — find work axis by name
