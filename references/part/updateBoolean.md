# part.updateBoolean

Updates an existing boolean feature. Can change the operation type and name. Requires the `openFeature`/`closeFeature` gate.

## Prerequisites

- An existing boolean feature (from `part.boolean`)
- Feature must be opened with `part.openFeature` before calling

## Key Parameters

- `id` — the boolean feature ID (returned from `part.boolean`)
- `type` — `"UNION"`, `"SUBTRACTION"`, or `"INTERSECTION"` (optional — only set to change)
- `name` — new name for the feature (optional)
- `target` — object `{id, indices}` to change the base feature (optional)
- `tools` — array to change tool features (optional)

## Return Value

Returns the boolean feature ID (same ID as input). maxLevel=31 on success.

## Usage Pattern

```js
await api.v1.part.openFeature({ id: boolId })
await api.v1.part.updateBoolean({ id: boolId, type: 'SUBTRACTION' })
await api.v1.part.closeFeature({ id: boolId })
```

## Gotchas

- **`openFeature` is mandatory.** Without it: error code 1200 `"The provided feature is not allowed to update. It's not active and open."` followed by code 1004.
- Changing `type` recomputes geometry immediately on `closeFeature`.

## Related

- `part.boolean` — creates the boolean feature this updates
- `part.openFeature` / `part.closeFeature` — required gate
