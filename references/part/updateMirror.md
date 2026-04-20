# part.updateMirror

Updates an existing mirror feature's name, targets, or reference plane.

## Prerequisites

- An existing mirror feature (`part.mirror`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **mirror feature ID** (returned by `part.mirror`, not the part ID)
- `name` — new feature name (optional)
- `targets` — new target list (optional). **Replaces the entire target list** — pass the complete set, not just additions.
- `references` — new mirror plane (optional). Same restriction as `mirror`: work plane IDs only.

All optional params are truly optional — omitted params keep their existing values.

## Return Value

Returns the mirror feature ID on success (maxLevel=31). Returns null on failure (maxLevel=51).

## Gotchas

- **Requires openFeature/closeFeature.** Without `openFeature`, returns null with errors 1200 + 1004. Same pattern as `updateBox`, `updateCylinder`, etc.
- **`targets` is a full replacement.** Passing `targets: [newId]` removes all previous targets and sets only `newId`. To add a target, include all existing targets plus the new one.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing `openFeature` call | Call `openFeature({ id: mirrorId })` first |
| 1004 | '"id" must be provided for update.' | Follows error 1200 | Fix the openFeature issue |

## Working Example

```js
// Change mirror plane from Right to Front
await api.v1.part.openFeature({ id: mirrorId })
await api.v1.part.updateMirror({
  id: mirrorId,
  name: 'MirrorFront',
  references: [frontWpId],
})
await api.v1.part.closeFeature({ id: mirrorId })

// Add a target to an existing mirror
await api.v1.part.openFeature({ id: mirrorId })
await api.v1.part.updateMirror({
  id: mirrorId,
  targets: [box1, box2, newCylinder],  // full list, not just the new one
})
await api.v1.part.closeFeature({ id: mirrorId })
```

## Related

- `part.mirror` — create the mirror feature
- `part.openFeature` / `part.closeFeature` — required before/after update
