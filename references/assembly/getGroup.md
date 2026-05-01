# assembly.getGroup

Retrieves a group constraint by name from an assembly.

## Prerequisites

- A root assembly with at least one group constraint

## Key Parameters

- `id` (required) — the **assembly/product ID**. Instance IDs do not work (returns null).
- `name` (required) — the group name. Case-sensitive.

## Return Value

On success (maxLevel 31):
```js
{
  id: number,          // group constraint ID
  instanceIds: number[], // array of grouped instance IDs
  name: string         // group name
}
```

On not-found: `null`, maxLevel 51.

## Batch Query

Pass array of param objects: `getGroup([{ id: asmId, name: 'G1' }, { id: asmId, name: 'G2' }])`. Returns array — found entries have the full object, not-found entries are `null`. The `maxLevel` reflects the highest level across all queries (51 if any entry is not-found).

## Gotchas

- **Names are case-sensitive.** `'MyGroup'` ≠ `'mygroup'`.
- **Must use assembly/product ID, not instance ID.** Passing an instance ID returns null.
- **After rename, old name is gone.** `getGroup({ name: oldName })` returns null after `updateGroup({ name: newName })`.
- **Stale instance IDs after deletion.** If a grouped instance is deleted, the group still exists and `instanceIds` still contains the deleted instance's ID. The IDs are stale — they no longer reference valid instances.
- **Default name is `'Group'`.** If you created a group without specifying a name, retrieve it with `getGroup({ name: 'Group' })`.

## Common Errors

| Error | Meaning |
|---|---|
| `There couldn't be found a constraint with name "X" on product...` | No group with that name exists |

## Working Example

```js
// Basic retrieval
const info = (await api.v1.assembly.getGroup({ id: asmId, name: 'MainGroup' })).result
// info → { id: 269, name: 'MainGroup', instanceIds: [255, 257, 259] }

// Batch retrieval
const batch = (await api.v1.assembly.getGroup([
  { id: asmId, name: 'Group1' },
  { id: asmId, name: 'Group2' },
])).result
// batch → [{ id: ..., ... }, { id: ..., ... }]

// Not-found check
const r = await api.v1.assembly.getGroup({ id: asmId, name: 'Missing' })
if (r.result === null) console.log('not found')
```

## Related

- `assembly.group` — create group constraints
- `assembly.updateGroup` — modify group params
- `assembly.deleteConstraint` — delete groups (use `ids` array)
