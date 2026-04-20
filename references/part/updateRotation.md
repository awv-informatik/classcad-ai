# part.updateRotation

Modifies an existing rotation feature. Only pass the fields you want to change — unspecified fields keep their existing values.

## Prerequisites

- An existing rotation feature (from `part.rotation`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **rotation feature ID** (not the part ID)
- `name` — rename the feature
- `targets` — change which features are rotated
- `references` — change the rotation axis (work axis, brep edge, two work points)
- `angle` — change rotation angle (radians)
- `inverted` — toggle rotation direction (0/1)

All fields are optional — partial updates work.

## Return Value

Feature ID on success, maxLevel=31. Returns null on failure (maxLevel=51).

## Gotchas

- **Requires openFeature/closeFeature gate.** Without it: code 1200.
- **Partial updates work.** `{ id: rId, angle: 1.5708 }` changes only the angle.
- **Rotation axis can be changed** by updating `references` — completely reorients the body.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: rId })` first |

## Working Example

```js
// Update angle
await api.v1.part.openFeature({ id: rId })
await api.v1.part.updateRotation({ id: rId, angle: 1.5708 })
await api.v1.part.closeFeature({ id: rId })

// Change rotation axis
await api.v1.part.openFeature({ id: rId })
await api.v1.part.updateRotation({ id: rId, references: [newAxisId] })
await api.v1.part.closeFeature({ id: rId })
```

## Related

- `part.rotation` — create the rotation feature
- `part.openFeature` / `part.closeFeature` — required gate for all updates
