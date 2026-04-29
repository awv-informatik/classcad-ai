# assembly.updateCylindrical

Updates an existing cylindrical constraint. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing cylindrical constraint (from `assembly.cylindrical`)
- The constraint ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **constraint ID** returned by `cylindrical()`. Not the assembly ID — passing the assembly ID errors with code 1007.
- `name` — rename the constraint. After renaming, `getCylindrical` with the old name returns VOID (maxLevel 51).
- `mate1` / `mate2` — partial update of mate sub-properties:
  - `path` — change which instance the constraint targets. Must also provide `csys` from the new instance's template.
  - `csys` — change which WCS the mate references. Can be updated alone.
  - `flip` — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`. Can be updated alone.
  - `reorient` — `'0'` | `'90'` | `'180'` | `'270'` (strings). Can be updated alone.
  - Mate sub-properties update independently — setting only `flip` preserves path, csys, and reorient.
- `zOffsetLimits` — object with `min` and/or `max`. **Partial limits allowed on update** (unlike create):
  - `{ min: -50 }` — updates min only, preserves max
  - `{ max: 40 }` — updates max only, preserves min
  - `{ min: null }` — removes min only, preserves max
  - `null` — removes both limits entirely (sets to `{min: null, max: null}`)
  - `undefined` (omitting param) — preserves existing limits
- `zRotationLimits` — same semantics as zOffsetLimits:
  - `{ min: '-45deg' }` — updates min only, preserves max
  - `{ max: '90deg' }` — updates max only
  - `{ min: null }` — removes min only
  - `null` — removes both limits
  - Accepts radians (number) or degree expressions (string like `'45deg'`). Stored as radians.

## Return Value

- **Single call:** the constraint ID (same ID as input)
- **Batch call (array param):** array of constraint IDs
- **On error:** `null`, maxLevel 51
- **On success:** maxLevel 31

## Partial Update Behavior

Only the params you pass are changed. All others are preserved — verified comprehensively across name, zOffsetLimits, zRotationLimits, mate1/mate2 sub-properties.

## Key Difference from Create

`cylindrical` (create) requires **both** min and max for `zRotationLimits` — partial limits fail. `updateCylindrical` allows partial limits for **both** `zOffsetLimits` and `zRotationLimits`.

## Batch Update

Pass array of param objects: `updateCylindrical([{ id: c1, zOffsetLimits: { min: -10 } }, { id: c2, name: 'Renamed' }])`. Returns array of constraint IDs.

## Gotchas

- **`id` is the constraint ID, not the assembly ID.** Passing the assembly ID gives: "The provided id for the constraint is not a constraint or relation." (code 1007).
- **Name update makes old name unfindable.** `getCylindrical({ name: oldName })` returns VOID after renaming.
- **Retargeting requires both path and csys.** When changing `mate.path` to a different instance, provide `csys` from the new template.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided for update.` | Missing or invalid constraint ID | 1004 |
| `The provided id for the constraint is not a constraint or relation.` | Assembly ID instead of constraint ID | 1007 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value | 1013 |

## Working Example

```js
const cId = (await api.v1.assembly.cylindrical({
  id: asmId, name: 'Slide',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})).result

// Add limits
await api.v1.assembly.updateCylindrical({
  id: cId,
  zOffsetLimits: { min: -20, max: 40 },
  zRotationLimits: { min: '-45deg', max: '90deg' },
})

// Update just one limit
await api.v1.assembly.updateCylindrical({ id: cId, zOffsetLimits: { min: -50 } })

// Remove rotation limits
await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: null })

// Update mate flip
await api.v1.assembly.updateCylindrical({ id: cId, mate2: { flip: '-Z' } })

// Retarget to different instance
await api.v1.assembly.updateCylindrical({
  id: cId,
  mate2: { path: [newInst], csys: newWcs },
})

// Batch update
await api.v1.assembly.updateCylindrical([
  { id: c1, zOffsetLimits: { min: -10, max: 10 } },
  { id: c2, zRotationLimits: { min: '-60deg', max: '60deg' } },
])
```

## Related

- `assembly.cylindrical` — create the constraint this updates
- `assembly.getCylindrical` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array, not `id`)
- `assembly.updateRevolute` — update the 1-DOF variant (similar pattern)
