# part.updateLinearPattern

Modifies an existing linear pattern feature. Only pass the fields you want to change — unspecified fields keep their existing values.

## Prerequisites

- An existing linear pattern feature (from `part.linearPattern`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **linear pattern feature ID** (not the part ID — unlike `linearPattern` which takes the part ID)
- `name` — rename the feature
- `targets` — change which features are patterned
- `dir1` — update first direction (any sub-field: `references`, `distance`, `count`, `inverted`, `merged`)
- `dir2` — update or add second direction (can add dir2 to a 1D pattern to make it 2D)

All fields are optional — partial updates work. Only pass what changed.

## Return Value

Feature ID on success, maxLevel=31. Returns null on failure (maxLevel=51).

## Gotchas

- **Requires openFeature/closeFeature gate.** Without it: code 1200 "The provided feature is not allowed to update. It's not active and open."
- **Partial dir1/dir2 updates work.** `dir1: { count: 6 }` changes only the count, keeping existing references and distance.
- **You can add dir2 via update** to convert a 1D pattern into a 2D grid after creation.
- **merged can be toggled** from 0→1 or 1→0 via update.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: lpId })` first |

## Working Example

```js
// Update count from 3 to 6
await api.v1.part.openFeature({ id: lpId })
await api.v1.part.updateLinearPattern({
  id: lpId,
  dir1: { count: 6 },
})
await api.v1.part.closeFeature({ id: lpId })

// Add second direction to make 2D grid
await api.v1.part.openFeature({ id: lpId })
await api.v1.part.updateLinearPattern({
  id: lpId,
  dir2: { references: [waY], distance: 30, count: 3 },
})
await api.v1.part.closeFeature({ id: lpId })

// Toggle merged on
await api.v1.part.openFeature({ id: lpId })
await api.v1.part.updateLinearPattern({
  id: lpId,
  dir1: { merged: 1 },
})
await api.v1.part.closeFeature({ id: lpId })
```

## Related

- `part.linearPattern` — create the pattern
- `part.openFeature` / `part.closeFeature` — required gate for all updates
