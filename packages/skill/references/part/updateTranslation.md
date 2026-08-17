# part.updateTranslation

Modifies an existing translation feature. Only pass the fields you want to change — unspecified fields keep their existing values.

## Prerequisites

- An existing translation feature (from `part.translation`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **translation feature ID** (not the part ID)
- `name` — rename the feature
- `targets` — change which features are translated
- `references` — change the direction (work axis, brep edge, two work points)
- `distance` — change translation distance
- `inverted` — toggle direction (0/1)

All fields are optional — partial updates work.

## Return Value

Feature ID on success, maxLevel=31. Returns null on failure (maxLevel=51).

## Gotchas

- **Requires openFeature/closeFeature gate.** Without it: code 1200.
- **Partial updates work.** `{ id: tId, distance: 80 }` changes only the distance.
- **Direction can be changed** by updating `references` to a different axis/edge/points.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: tId })` first |

## Working Example

```js
// Update distance
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTranslation({ id: tId, distance: 80 })
await api.v1.part.closeFeature({ id: tId })

// Change direction
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTranslation({ id: tId, references: [newAxisId] })
await api.v1.part.closeFeature({ id: tId })

// Toggle inverted
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTranslation({ id: tId, inverted: 1 })
await api.v1.part.closeFeature({ id: tId })
```

## Related

- `part.translation` — create the translation feature
- `part.openFeature` / `part.closeFeature` — required gate for all updates
