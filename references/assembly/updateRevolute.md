# assembly.updateRevolute

Updates an existing revolute constraint. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing revolute constraint (from `assembly.revolute`)
- The constraint ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **constraint ID** returned by `revolute()`. Not the assembly ID — passing the assembly ID errors with code 1007.
- `name` — rename the constraint. After renaming, `getRevolute` with the old name returns VOID (maxLevel 51).
- `mate1` / `mate2` — partial update of mate sub-properties:
  - `path` — change which instance the constraint targets. Must also provide `csys` from the new instance's template.
  - `csys` — change which WCS the mate references. Can be updated alone (without path).
  - `flip` — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`. Can be updated alone.
  - `reorient` — `'0'` | `'90'` | `'180'` | `'270'` (strings, not numbers). Can be updated alone.
  - Mate sub-properties update independently — setting only `flip` preserves path, csys, and reorient.
- `zOffset` — new offset along the rotation axis. Pass `0` to reset.
- `zRotationLimits` — object with `min` and/or `max`. Unlike `revolute` (create), **partial limits are allowed** on update:
  - `{ min: '-45deg' }` — updates min only, preserves max
  - `{ max: '90deg' }` — updates max only, preserves min
  - `{ min: null }` — removes min only, preserves max
  - `{ max: null }` — removes max only, preserves min
  - `null` — removes both limits entirely
  - `undefined` (omitting param) — preserves existing limits
  - `{}` — **errors** (must provide at least one of min/max)
  - Accepts radians (number) or degree expressions (string like `'45deg'`). Stored as radians.

## Return Value

- **Single call:** the constraint ID (same ID as input)
- **Batch call (array param):** array of constraint IDs
- **On error:** `null`, maxLevel 51
- **On success:** maxLevel 31

## Partial Update Behavior

Only the params you pass are changed. All others are preserved — verified comprehensively across name, zOffset, zRotationLimits (min, max), mate1 (flip, reorient, path, csys), mate2 (flip, reorient, path, csys). This is reliable.

## Retargeting (Changing Instances)

You can retarget a revolute constraint to a completely different instance — even from a different template. Update `mate.path` and `mate.csys` together. The csys must belong to the new instance's template.

## Batch Update

Pass array of param objects: `updateRevolute([{ id: c1, zOffset: 5 }, { id: c2, name: 'Renamed' }])`. Returns array of constraint IDs.

## Key Difference from Create

`revolute` (create) requires **both** min and max if `zRotationLimits` is provided — partial limits fail with "max must be provided". `updateRevolute` allows partial limits — you can set or remove min/max independently.

## Gotchas

- **`id` is the constraint ID, not the assembly ID.** Passing the assembly ID gives: "The provided id for the constraint is not a constraint or relation." (code 1007).
- **Name update makes old name unfindable.** `getRevolute({ name: oldName })` returns VOID after renaming.
- **`{}` for zRotationLimits errors.** Provide at least one of min/max, or use `null` to remove.
- **Retargeting requires both path and csys.** When changing `mate.path` to a different instance, provide `csys` from the new instance's template.
- **Failed updates are safe.** Errors don't corrupt the existing constraint — verified across 7 error scenarios.

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
const cId = (await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})).result

// Update name and offset
await api.v1.assembly.updateRevolute({ id: cId, name: 'MainHinge', zOffset: 15 })

// Add rotation limits
await api.v1.assembly.updateRevolute({
  id: cId,
  zRotationLimits: { min: '-90deg', max: '120deg' },
})

// Update just one limit
await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { max: '180deg' } })

// Remove limits
await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: null })

// Update mate flip
await api.v1.assembly.updateRevolute({ id: cId, mate2: { flip: '-Z' } })

// Retarget to different instance
await api.v1.assembly.updateRevolute({
  id: cId,
  mate2: { path: [newInst], csys: newWcs },
})

// Batch update
await api.v1.assembly.updateRevolute([
  { id: c1, zOffset: 5 },
  { id: c2, zRotationLimits: { min: '-60deg', max: '60deg' } },
])
```

## Related

- `assembly.revolute` — create the constraint this updates
- `assembly.getRevolute` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array, not `id`)
- `assembly.updateFastened` — update the 0-DOF variant (similar pattern)
