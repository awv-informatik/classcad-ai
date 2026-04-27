# assembly.getInstance

Returns instances belonging to an owner (root assembly, assembly instance, or assembly template).

## Prerequisites

- An assembly with instances already created

## Key Parameters

- `ownerId` (required) — the parent to search in. Must be assembly or instance type (not part template).
- `name` (optional) — filter by instance name. If omitted, returns ALL instances.

## Return Value

- **With name:** single numeric ID (if found) or empty array `[]` (if not found — NOT an error)
- **Without name:** array of all instance IDs `[id1, id2, ...]`
- **Batch:** supports array of param objects, returns array of results
- **Invalid owner:** null with maxLevel 51

## Gotchas

- Not-found returns empty array `[]` with maxLevel 31 — no error raised
- Duplicate names: returns only the FIRST match
- Only accepts assembly or instance IDs as owner — part template IDs are rejected
- Works on assembly instances too (returns their expanded-tree children)

## Working Example

```js
// Get all instances
const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
// → [105, 107, 109]

// Get by name
const one = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Block_A' })).result
// → 105

// Batch lookup
const batch = (await api.v1.assembly.getInstance([
  { ownerId: asmId, name: 'Block_A' },
  { ownerId: asmId, name: 'Block_B' },
])).result
// → [105, 107]
```

## Related

- `assembly.instance` — create instances
- `assembly.deleteInstance` — remove instances
