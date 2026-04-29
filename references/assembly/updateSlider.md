# assembly.updateSlider

Updates an existing slider constraint. Only the specified parameters are changed — omitted fields retain their current values.

## Prerequisites

- An existing slider constraint (created via `assembly.slider`)

## Key Parameters

- `id` (required) — the slider **constraint** ID (not the assembly ID)
- `name` (optional) — new name for the constraint
- `mate1` / `mate2` (optional) — update mate configuration (path, csys, flip, reorient)
- `xOffset` (optional) — new fixed X offset
- `yOffset` (optional) — new fixed Y offset
- `zOffsetLimits` (optional) — update translation limits:
  - Partial update `{ min: -50 }` preserves the existing max
  - Partial update `{ max: 100 }` preserves the existing min
  - Setting to `null` clears both limits → `{ min: null, max: null }`

## Return Value

- Returns the constraint ID on success, maxLevel 31
- Returns null on error, maxLevel 51

## Partial zOffsetLimits Behavior

| Update | Effect on min | Effect on max |
|---|---|---|
| `{ min: -50 }` | changed to -50 | preserved |
| `{ max: 100 }` | preserved | changed to 100 |
| `{ min: -50, max: 100 }` | changed to -50 | changed to 100 |
| `null` | set to null | set to null |

## Gotchas

- **`id` is the constraint ID**, not the assembly ID. This is the ID returned by `slider()`.
- **Partial mate updates work.** You can update just `mate1.flip` without re-specifying the full mate1 object — but you must include `path` and `csys` in the mate object you provide.

## Working Example

```js
// Update offsets and limits
await api.v1.assembly.updateSlider({
  id: constraintId,
  xOffset: 20,
  yOffset: -10,
  zOffsetLimits: { min: -15, max: 25 },
})

// Rename
await api.v1.assembly.updateSlider({ id: constraintId, name: 'NewName' })

// Change slide axis direction
await api.v1.assembly.updateSlider({
  id: constraintId,
  mate1: { path: [inst1], csys: wcs1, flip: 'X' },
})

// Clear limits
await api.v1.assembly.updateSlider({ id: constraintId, zOffsetLimits: null })
```

## Related

- `assembly.slider` — create the constraint
- `assembly.getSlider` — retrieve current state by name
