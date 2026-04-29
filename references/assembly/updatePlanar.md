# assembly.updatePlanar

Updates an existing planar constraint by constraint ID. All properties are optional — only provided params are changed; omitted params keep their current values.

## Key Parameters

- `id` (required) — constraint ID (from `planar()` or `getPlanar()`)
- `name` (optional) — new name
- `mate1` / `mate2` (optional) — update path, csys, flip, or reorient. Can update individual sub-fields
- `zOffset` (optional) — new fixed Z offset value
- `xOffsetLimits` (optional) — `{ min, max }`, partial allowed, or `null` to clear
- `yOffsetLimits` (optional) — `{ min, max }`, partial allowed, or `null` to clear
- `zRotationLimits` (optional) — `{ min, max }`, **partial allowed on update** (unlike create). Pass `null` to clear all limits, or `{ max: null }` to clear just max

## Partial Limits on Update

Unlike create, **all limits accept partial specs on update**:
- `zRotationLimits: { max: '180deg' }` — updates max, keeps existing min
- `xOffsetLimits: { min: -10 }` — updates min, keeps existing max
- `yOffsetLimits: null` — clears both min and max to `{ min: null, max: null }`

## Return Value

- Returns constraint ID on success (maxLevel 31)
- Returns null on error (maxLevel 51)

## Working Example

```js
// Update offset
await api.v1.assembly.updatePlanar({ id: constraintId, zOffset: 30 })

// Add limits
await api.v1.assembly.updatePlanar({ id: constraintId, xOffsetLimits: { min: -30, max: 30 } })

// Partial rotation limit update
await api.v1.assembly.updatePlanar({ id: constraintId, zRotationLimits: { max: '180deg' } })

// Clear limits
await api.v1.assembly.updatePlanar({ id: constraintId, xOffsetLimits: null })
await api.v1.assembly.updatePlanar({ id: constraintId, zRotationLimits: null })

// Update mate flip/reorient
await api.v1.assembly.updatePlanar({ id: constraintId, mate2: { flip: '-Z', reorient: '90' } })
```

## Related

- `assembly.planar` — create the constraint
- `assembly.getPlanar` — retrieve by name
