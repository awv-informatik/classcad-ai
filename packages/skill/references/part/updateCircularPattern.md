# part.updateCircularPattern

Modifies an existing circular pattern feature. Only pass the fields you want to change — unspecified fields keep their existing values.

## Prerequisites

- An existing circular pattern feature (from `part.circularPattern`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **circular pattern feature ID** (not the part ID)
- `name` — rename the feature
- `targets` — change which features are patterned (can add/remove features)
- `references` — change the rotation axis (work axis, brep edge)
- `angle` — change angular spacing (radians)
- `count` — change number of instances (includes original)
- `inverted` — toggle rotation direction (0=CCW, 1=CW)
- `merged` — toggle merge (note: `merged: 1` inherits the same boolean error 1001 bug as `circularPattern`)

All fields are optional — partial updates work. Only pass what changed.

## Return Value

Feature ID on success, maxLevel=31. Returns null on failure (maxLevel=51).

## Gotchas

- **Requires openFeature/closeFeature gate.** Without it: code 1200 "The provided feature is not allowed to update. It's not active and open."
- **Partial updates work.** `{ id: cpId, count: 8 }` changes only the count.
- **Rotation axis can be changed.** Updating `references` completely reorients the pattern — e.g., switching from Z-axis to X-axis changes a horizontal ring into a vertical one.
- **Targets can be changed.** Add or remove features from the pattern via update.
- **merged still fails** — same boolean error 1001 as `circularPattern`.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: cpId })` first |

## Working Example

```js
// Update count
await api.v1.part.openFeature({ id: cpId })
await api.v1.part.updateCircularPattern({
  id: cpId,
  count: 8,
})
await api.v1.part.closeFeature({ id: cpId })

// Change rotation axis
await api.v1.part.openFeature({ id: cpId })
await api.v1.part.updateCircularPattern({
  id: cpId,
  references: [newAxisId],
})
await api.v1.part.closeFeature({ id: cpId })

// Change angle and invert direction
await api.v1.part.openFeature({ id: cpId })
await api.v1.part.updateCircularPattern({
  id: cpId,
  angle: 0.5236, // 30°
  inverted: 1,
})
await api.v1.part.closeFeature({ id: cpId })
```

## Related

- `part.circularPattern` — create the pattern
- `part.openFeature` / `part.closeFeature` — required gate for all updates
