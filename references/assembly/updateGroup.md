# assembly.updateGroup

Updates an existing group constraint. All params except `id` are optional — unset params are preserved.

## Prerequisites

- An existing group constraint (from `assembly.group`)
- The group constraint ID (not the assembly ID)

## Key Parameters

- `id` (required) — the **group constraint ID** returned by `group()`. Not the assembly ID.
- `name` — rename the group. After renaming, `getGroup` with the old name returns VOID.
- `instanceIds` — replace the grouped instances. Must be instance IDs (same restriction as `group()`).

## Return Value

- **Single call:** the group constraint ID (same ID as input), maxLevel 31
- **Batch call (array param):** array of group constraint IDs
- **On error:** `null`, maxLevel 51

## Partial Update Behavior

Only the params you pass are changed. All others are preserved. Updating name alone leaves instanceIds intact. Updating instanceIds alone leaves name intact.

Both params can be updated in a single call (atomic multi-param update).

## Batch Update

Pass array of param objects: `updateGroup([{ id: g1, name: 'New' }, { id: g2, instanceIds: [...] }])`. Returns array of group constraint IDs.

## No openFeature/closeFeature Required

Like gear relations, group updates work directly without the open/close pattern.

## Gotchas

- **`id` is the group constraint ID, not the assembly ID.** Passing the assembly ID gives code 1007: "not a constraint or relation".
- **Passing an instance ID as `id` also fails.** Same code 1007.
- **instanceIds restrictions apply.** Same as `group()` — only instance IDs accepted, code 1001 for wrong types.
- **Failed updates are safe.** Errors don't corrupt the existing group.
- **Rename invalidates old name.** `getGroup({ name: oldName })` returns null after rename.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided for update.` | Missing id param | 1004 |
| `The provided id for the constraint is not a constraint or relation.` | Assembly/instance ID instead of group ID | 1007 |
| `The provided constraint id does not exist.` | Nonexistent ID | 1006 |
| `"instanceIds" has a wrong id type! [...instance]` | Non-instance ID in array | 1001 |

## Working Example

```js
const groupId = (await api.v1.assembly.group({
  id: asmId, name: 'G1', instanceIds: [inst1, inst2],
})).result

// Update instanceIds only
await api.v1.assembly.updateGroup({ id: groupId, instanceIds: [inst1, inst2, inst3] })

// Rename only (instanceIds preserved)
await api.v1.assembly.updateGroup({ id: groupId, name: 'Renamed' })

// Update both at once
await api.v1.assembly.updateGroup({
  id: groupId, name: 'Final', instanceIds: [inst1],
})

// Batch update
await api.v1.assembly.updateGroup([
  { id: group1, name: 'NewName1' },
  { id: group2, instanceIds: [inst1, inst2] },
])
```

## Related

- `assembly.group` — create the group this updates
- `assembly.getGroup` — retrieve group state by name
- `assembly.deleteConstraint` — delete groups (use `ids` array)
