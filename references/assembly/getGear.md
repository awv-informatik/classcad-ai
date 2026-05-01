# assembly.getGear

Retrieves a gear relation by name from an assembly.

## Prerequisites

- A root assembly with at least one gear relation

## Key Parameters

- `id` (required) — the **assembly/product ID**. Instance IDs do not work (returns null).
- `name` (required) — the gear relation name. Case-sensitive.

## Return Value

On success (maxLevel 31):
```js
{
  id: number,        // gear relation ID
  name: string,      // gear relation name
  constr1Id: number,  // first revolute constraint ID
  constr2Id: number,  // second revolute constraint ID
  ratio: number,     // gear ratio
  offset: number     // angular offset in RADIANS (even if created with degree expression)
}
```

On not-found: `null`, maxLevel 51.

## Batch Query

Pass array of param objects: `getGear([{ id: asmId, name: 'G1' }, { id: asmId, name: 'G2' }])`. Returns array — found entries have the full object, not-found entries are `null`. The `maxLevel` reflects the highest level across all queries (51 if any entry is not-found).

## Gotchas

- **Names are case-sensitive.** `'TestGear'` ≠ `'testgear'`.
- **Must use assembly/product ID, not instance ID.** Passing an instance ID returns null.
- **Offset always in radians.** Even if the gear was created or updated with `'45deg'`, `getGear` returns `offset: 0.7854` (radians).
- **After rename, old name is gone.** `getGear({ name: oldName })` returns null after `updateGear({ name: newName })`.
- **Empty name returns null.** Not an error, just not-found.

## Common Errors

| Error | Meaning |
|---|---|
| `There couldn't be found a constraint with name "X" on product...` | No gear relation with that name exists |

## Working Example

```js
// Basic retrieval
const info = (await api.v1.assembly.getGear({ id: asmId, name: 'MainGear' })).result
// info → { id: 263, name: 'MainGear', constr1Id: 255, constr2Id: 259, ratio: 2, offset: 0.7854 }

// Batch retrieval
const batch = (await api.v1.assembly.getGear([
  { id: asmId, name: 'Gear1' },
  { id: asmId, name: 'Gear2' },
])).result
// batch → [{ id: ..., ... }, { id: ..., ... }]

// Not-found check
const r = await api.v1.assembly.getGear({ id: asmId, name: 'Missing' })
if (r.result === null) console.log('not found')
```

## Related

- `assembly.gear` — create gear relations
- `assembly.updateGear` — modify gear relation params
- `assembly.deleteConstraint` — delete gear relations (use `ids` array)
