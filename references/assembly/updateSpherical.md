# assembly.updateSpherical

Updates an existing spherical constraint by constraint ID. All properties are optional — only specify what you want to change.

## Key Parameters

- `id` (required) — constraint ID (returned by `spherical()`, NOT the assembly ID)
- `name` (optional) — new name for the constraint
- `mate1` / `mate2` (optional) — update mate path, csys, flip, or reorient. Partial mate update supported (e.g., only change `csys` without re-specifying `path`)
- `yRotationLimits` (optional) — `{ max: value }` or `null` to remove limits
  - `{ max: '90deg' }` or `{ max: 1.57 }` — set/change the max
  - `null` — remove all limits (max becomes null)

## Return Value

Returns constraint ID on success (maxLevel 31). Returns null on error (maxLevel 51).

## Gotchas

- **Pass constraint ID, not assembly ID.** The `id` is the constraint's own ID from creation.
- **null removes limits.** `{ yRotationLimits: null }` sets max to null (unlimited). This is the only way to remove limits after creation.
- **Mate retarget works.** Can switch which WCS a mate references by providing new `path` + `csys`.

## Working Example

```js
// Update name
await api.v1.assembly.updateSpherical({ id: constraintId, name: 'NewName' })

// Add/change rotation limits
await api.v1.assembly.updateSpherical({ id: constraintId, yRotationLimits: { max: '60deg' } })

// Remove rotation limits
await api.v1.assembly.updateSpherical({ id: constraintId, yRotationLimits: null })

// Retarget mate2 to different WCS
await api.v1.assembly.updateSpherical({ id: constraintId, mate2: { path: [instId], csys: newWcsId } })
```

## Related

- `assembly.spherical` — create the constraint
- `assembly.getSpherical` — retrieve constraint definition by name
