# assembly.updateParallel

Updates an existing parallel constraint by constraint ID. All properties are optional — only provided params are changed; omitted params keep their current values.

## Key Parameters

- `id` (required) — constraint ID (from `parallel()` or `getParallel()`)
- `name` (optional) — new name
- `mate1` / `mate2` (optional) — update path, csys, flip, or reorient. Can update individual sub-fields
- `xOffsetLimits` (optional) — `{ min, max }`, or `null` to clear
- `yOffsetLimits` (optional) — `{ min, max }`, or `null` to clear
- `zOffsetLimits` (optional) — `{ min, max }`, or `null` to clear
- `zRotationLimits` (optional) — `{ min, max }`, or `null` to clear. Accepts deg expressions: `{ max: '45deg' }`

## Clearing Limits

- Pass `null` for the limit property to clear it: `{ xOffsetLimits: null }` → sets to `{ min: null, max: null }`
- Pass `{ min: null, max: null }` explicitly — also works
- **Do NOT pass `'VOID'` string** — errors with code 1001 ("wrong type")
- **Do NOT pass `{}`** — errors with code 1001
- Clearing one limit preserves all others

## Return Value

- Returns constraint ID on success (maxLevel 31)
- Returns null on error (maxLevel 51)

## Working Example

```js
// Add limits after creation
await api.v1.assembly.updateParallel({
  id: constraintId,
  xOffsetLimits: { min: -10, max: 10 },
  zRotationLimits: { min: '0deg', max: '45deg' },
})

// Rename
await api.v1.assembly.updateParallel({ id: constraintId, name: 'NewName' })

// Update mate flip/reorient
await api.v1.assembly.updateParallel({
  id: constraintId,
  mate1: { flip: 'X' },
  mate2: { flip: '-Y', reorient: '90' },
})

// Clear limits
await api.v1.assembly.updateParallel({ id: constraintId, xOffsetLimits: null })
await api.v1.assembly.updateParallel({ id: constraintId, zRotationLimits: null })
```

## Related

- `assembly.parallel` — create the constraint
- `assembly.getParallel` — retrieve by name
