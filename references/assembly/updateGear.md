# assembly.updateGear

Updates an existing gear relation. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing gear relation (from `assembly.gear`)
- The gear relation ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **gear relation ID** returned by `gear()`. Not the assembly ID.
- `name` — rename the gear relation. After renaming, `getGear` with the old name returns VOID.
- `constr1Id` — reassign the first revolute constraint. Must be a revolute constraint ID.
- `constr2Id` — reassign the second revolute constraint. Must be a revolute constraint ID.
- `ratio` — new gear ratio. No validation — accepts 0, negative, very large values.
- `offset` — new angular offset in radians, or a degree expression string (`'45deg'`, `'90deg'`). No range validation — negative and >2π accepted.

## Return Value

- **Single call:** the gear relation ID (same ID as input), maxLevel 31
- **Batch call (array param):** array of gear relation IDs
- **On error:** `null`, maxLevel 51

## Partial Update Behavior

Only the params you pass are changed. All others are preserved — verified across name, ratio, offset, constr1Id, and constr2Id. Updating ratio alone leaves offset, name, and constraint IDs intact.

All 5 optional params can be updated in a single call (atomic multi-param update).

## Batch Update

Pass array of param objects: `updateGear([{ id: g1, ratio: 3 }, { id: g2, name: 'New' }])`. Returns array of gear relation IDs.

## Gotchas

- **`id` is the gear relation ID, not the assembly ID.** Passing the assembly ID gives code 1007: "The provided id for the constraint is not a constraint or relation."
- **Passing a revolute constraint ID as `id` is a partial failure.** Unlike other wrong-type errors that return null, this returns the revolute ID back with maxLevel 51 and an internal error ("SetRelationParams not found"). Don't rely on null-checking alone.
- **Non-revolute constraint IDs for constr1Id/constr2Id are rejected.** Code 1001: "wrong id type! Only revoluteconstraint". Same constraint type restriction as `gear()`.
- **Failed updates are safe.** Errors don't corrupt the existing gear relation.
- **Cascade deletion still applies.** If the underlying revolute constraint is deleted after an update, the gear relation is cascade-deleted. Subsequent updateGear calls on the deleted ID fail.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided for update.` | Missing id param | 1004 |
| `ToId()/TOID() didn't get an existing or valid id.` | Nonexistent ID | 0 |
| `The provided id for the constraint is not a constraint or relation.` | Assembly ID instead of gear ID | 1007 |
| `"constr1Id" has a wrong id type! [...revoluteconstraint]` | Non-revolute constraint ID | 1001 |
| `SetRelationParams not found` | Revolute ID used as gear ID (internal error) | 0 |

## Working Example

```js
const gearId = (await api.v1.assembly.gear({
  id: asmId, name: 'G1',
  constr1Id: rev1, constr2Id: rev2, ratio: 1,
})).result

// Update ratio only
await api.v1.assembly.updateGear({ id: gearId, ratio: 3 })

// Update offset with degree expression
await api.v1.assembly.updateGear({ id: gearId, offset: '45deg' })

// Update multiple params at once
await api.v1.assembly.updateGear({
  id: gearId,
  name: 'Renamed',
  ratio: 5.5,
  offset: '120deg',
  constr1Id: rev2,
  constr2Id: rev1,
})

// Batch update
await api.v1.assembly.updateGear([
  { id: gear1, ratio: 3, offset: '45deg' },
  { id: gear2, ratio: 0.5, name: 'NewName' },
])
```

## Related

- `assembly.gear` — create the gear relation this updates
- `assembly.getGear` — retrieve gear relation state by name
- `assembly.deleteConstraint` — delete gear relations (use `ids` array)
