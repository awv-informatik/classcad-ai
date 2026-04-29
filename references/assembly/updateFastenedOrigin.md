# assembly.updateFastenedOrigin

Updates an existing fastenedOrigin constraint. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing fastenedOrigin constraint (from `assembly.fastenedOrigin`)
- The constraint ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **constraint ID** returned by `fastenedOrigin()`. Not the assembly ID — passing the assembly ID errors with code 1007.
- `name` — rename the constraint. After renaming, `getFastenedOrigin` with the old name returns VOID (maxLevel 51).
- `mate1` — partial update of mate sub-properties:
  - `path` — change which instance the constraint targets. Must also provide `csys` for the new instance's template.
  - `csys` — change which WCS the mate references. Can be updated alone (without path).
  - `flip` — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`. Can be updated alone.
  - `reorient` — `'0'` | `'90'` | `'180'` | `'270'` (strings, not numbers). Can be updated alone.
  - Mate sub-properties update independently — setting only `flip` preserves path, csys, and reorient.
- `xOffset` / `yOffset` / `zOffset` — new offset values. Pass `0` to reset.
- `xRotation` / `yRotation` / `zRotation` — accepts `real` (radians) or `string` (`'45deg'`). Stored as radians. Pass `0` to reset.
- `useCurrentTransform` — pass `1` (not `true`). Ignores all explicit offset/rotation values and recomputes them from the instance's current position.

## Return Value

- **Single call:** the constraint ID (same ID as input)
- **Batch call (array param):** array of constraint IDs
- **On error:** `null`, maxLevel 51
- **On success:** maxLevel 31

## Partial Update Behavior

Only the params you pass are changed. All others are preserved — verified comprehensively across name, all 3 offsets, all 3 rotations, mate1 flip, mate1 reorient, mate1 csys. This is reliable.

## Batch Update

Pass array of param objects: `updateFastenedOrigin([{ id: c1, xOffset: 100 }, { id: c2, zRotation: '90deg' }])`. Returns array of constraint IDs.

## Gotchas

- **`id` is the constraint ID, not the assembly ID.** Passing the assembly ID gives: "The provided id for the constraint is not a constraint or relation." (code 1007).
- **`useCurrentTransform: 1` overrides explicit offsets/rotations.** If you pass both `useCurrentTransform: 1` and `xOffset: 999`, the xOffset is ignored — UCT wins.
- **Name update makes old name unfindable.** `getFastenedOrigin({ name: oldName })` returns VOID after renaming.
- **Retargeting requires both path and csys.** When changing `mate1.path` to a different instance, provide `csys` from the new instance's template.
- **Failed updates are safe.** Errors don't corrupt the existing constraint — verified across 6 error scenarios.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided for update.` | Missing or invalid constraint ID | 1004 |
| `The provided id for the constraint is not a constraint or relation.` | Assembly ID instead of constraint ID | 1007 |
| `ToId()/TOID() didn't get an existing or valid id.` | Nonexistent constraint ID or csys ID | 1006 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value (must be "0"/"90"/"180"/"270") | 1013 |

## Working Example

```js
const foId = (await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO1',
  mate1: { path: [inst], csys: wcs },
  xOffset: 0,
})).result

// Update offset
await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 60 })

// Update rotation with degree string
await api.v1.assembly.updateFastenedOrigin({ id: foId, zRotation: '45deg' })

// Update multiple params at once
await api.v1.assembly.updateFastenedOrigin({
  id: foId,
  name: 'Renamed',
  xOffset: 40, yOffset: -10,
  mate1: { flip: '-Z' },
})

// Lock current position
await api.v1.assembly.updateFastenedOrigin({ id: foId, useCurrentTransform: 1 })

// Batch update
await api.v1.assembly.updateFastenedOrigin([
  { id: fo1, xOffset: 100 },
  { id: fo2, zRotation: '90deg' },
])
```

## Related

- `assembly.fastenedOrigin` — create the constraint this updates
- `assembly.getFastenedOrigin` — retrieve constraint by name
- `assembly.updateFastened` — update the two-mate variant
