# part.updateCircularPattern

Modifies an existing circular pattern. Partial updates: omitted fields keep their values (e.g. `{ id: cpId, count: 8 }` changes only the count). Must be wrapped in `part.openFeature` / `part.closeFeature`.

## Key Parameters

- `id` — **circular pattern feature ID** (not the part ID)
- `name` — rename
- `targets` — change patterned features (add/remove)
- `references` — change the rotation axis (work axis, brep edge). Completely reorients the pattern (Z→X axis turns a horizontal ring vertical).
- `angle` — spacing (radians)
- `count` — instances (includes original)
- `inverted` — direction (0=CCW, 1=CW)
- `merged` — can be switched `0` → `1` on an existing pattern (returns maxLevel 31)

## Return Value

Feature ID, maxLevel=31. null on failure (maxLevel=51).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: cpId })` first |
| 1001 | "Boolean operation failed with error 1001" | `merged: 1` and the new axis runs along a face/edge of the body, so all copies meet on the axis | Keep the body off the axis or use `merged: 0` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CircUpd' })).result
const armCS = (await api.v1.part.workCSys({ id: partId, name: 'ArmCS', offset: [40, -5, 20] })).result
const boxId = (await api.v1.part.box({ id: partId, length: 20, width: 10, height: 30, references: [armCS] })).result
// Axes must exist before the pattern (openFeature rolls the tree back to it)
const waZ = (await api.v1.part.workAxis({ id: partId, name: 'AxisZ', direction: [0, 0, 1] })).result
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', direction: [1, 0, 0] })).result
const cpId = (await api.v1.part.circularPattern({
  id: partId, targets: [boxId], references: [waZ], angle: 1.0472, count: 6,
})).result

// Count, angle, direction, merge
await api.v1.part.openFeature({ id: cpId })
await api.v1.part.updateCircularPattern({ id: cpId, count: 8, angle: 0.5236, inverted: 1, merged: 1 })
await api.v1.part.closeFeature({ id: cpId })

// Change rotation axis (the box sits 20 above the X axis, so the 8 copies stay disjoint)
await api.v1.part.openFeature({ id: cpId })
await api.v1.part.updateCircularPattern({ id: cpId, references: [waX], angle: 0.7854 })
await api.v1.part.closeFeature({ id: cpId })
```

## Related

`part.circularPattern` · `part.openFeature` / `part.closeFeature`
