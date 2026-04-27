# assembly.updateFastened

Updates an existing fastened constraint. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing fastened constraint (from `assembly.fastened`)
- The constraint ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **constraint ID** returned by `fastened()`. Not the assembly ID — passing the assembly ID errors with code 1007.
- `name` — rename the constraint. After renaming, `getFastened` with the old name returns VOID.
- `mate1` / `mate2` — partial update of mate sub-properties:
  - `path` — change which instance the mate references. Must also provide `csys` for the new instance's template.
  - `csys` — change which WCS the mate references. Must be a WCS from the path instance's template.
  - `flip` — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`
  - `reorient` — `'0'` | `'90'` | `'180'` | `'270'` (strings, not numbers)
  - Mate sub-properties update independently — setting only `flip` preserves path, csys, and reorient.
- `xOffset` / `yOffset` / `zOffset` — new offset values. Pass `0` to reset.
- `xRotation` / `yRotation` / `zRotation` — accepts `real` (radians) or `string` (`'45deg'`). Stored as radians. Pass `0` to reset.
- `useCurrentTransform` — when `true`, **ignores** all explicit offset/rotation values and recomputes them from the instances' current positions.

## Return Value

- **Single call:** the constraint ID (same ID as input)
- **Batch call (array param):** array of constraint IDs
- **On error:** `null`, maxLevel 51
- **On success:** maxLevel 31

## Partial Update Behavior

Only the params you pass are changed. All others are preserved — verified comprehensively across name, all 3 offsets, all 3 rotations, mate1 flip/reorient/csys, and mate2 flip/reorient/csys. This is reliable.

## Batch Update

Pass array of param objects: `updateFastened([{ id: c1, xOffset: 100 }, { id: c2, zRotation: '90deg' }])`. Returns array of constraint IDs.

## Gotchas

- **`id` is the constraint ID, not the assembly ID.** Passing the assembly ID gives: "The provided id for the constraint is not a constraint or relation." (code 1007).
- **`useCurrentTransform: true` overrides explicit offsets/rotations.** If you pass both `useCurrentTransform: true` and `xOffset: 999`, the xOffset is ignored.
- **Name update makes old name unfindable.** `getFastened({ name: oldName })` returns VOID after renaming.
- **Retargeting mates requires csys.** When changing `mate.path` to a different instance, you must also provide the `csys` from the new instance's template.
- **Failed updates are safe.** Errors don't corrupt the existing constraint.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided for update.` | Missing or invalid constraint ID | 1004 |
| `The provided constraint id does not exist.` | Nonexistent constraint ID | 1006 |
| `The provided id for the constraint is not a constraint or relation.` | Assembly ID instead of constraint ID | 1007 |
| `An element of parameter "csys" has an invalid id!` | Nonexistent WCS ID | 1006 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value (must be "0"/"90"/"180"/"270") | 1013 |

## Working Example

```js
const cId = (await api.v1.assembly.fastened({
  id: asmId, name: 'F1',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  xOffset: 10,
})).result

// Update offset
await api.v1.assembly.updateFastened({ id: cId, xOffset: 50 })

// Update rotation with degree string
await api.v1.assembly.updateFastened({ id: cId, zRotation: '45deg' })

// Update multiple params at once
await api.v1.assembly.updateFastened({
  id: cId,
  name: 'Renamed',
  xOffset: 40, yOffset: -10,
  mate1: { flip: '-Z' },
})

// Lock current position
await api.v1.assembly.updateFastened({ id: cId, useCurrentTransform: true })

// Batch update
await api.v1.assembly.updateFastened([
  { id: c1, xOffset: 100 },
  { id: c2, zRotation: '90deg' },
])
```

## Related

- `assembly.fastened` — create the constraint this updates
- `assembly.getFastened` — retrieve constraint state by name
- `assembly.fastenedOrigin` — single-mate variant (locks to assembly origin)
