# assembly.getInstance

Returns instances belonging to an owner. Supports lookup by name (single result) or listing all (array result).

## Prerequisites

- An assembly with instances already created (or an assembly template / assembly instance with children)

## Key Parameters

- `ownerId` (required) — the parent to search in. Accepts:
  - Root assembly ID
  - Assembly template ID
  - Assembly instance ID (returns expanded-tree children)
  - **Not accepted:** part template IDs → error "wrong id type"
- `name` (optional) — filter by instance name. Changes return type.

## Return Value

| Mode | Result | Notes |
|---|---|---|
| With `name`, found | single numeric ID | `typeof result === 'number'` |
| With `name`, not found | `[]` (empty array) | maxLevel 31, no error |
| Without `name`, has children | `[id1, id2, ...]` | Array in **creation order** |
| Without `name`, no children | `[]` (empty array) | maxLevel 31, no error |
| Invalid owner | `null` | maxLevel 51 |
| Batch | `[result1, result2, ...]` | Each entry: numeric ID or `[]` |

**maxLevel:** Always 31 on success (even when not-found). Error cases return 51.

## Batch Form

Pass an array of param objects. Returns an array with one result per entry:
- Found by name → numeric ID
- Not found → `[]`

Unlike `assembly.instance`, batch `getInstance` does NOT fail all-or-nothing. Individual not-found entries return `[]` without affecting other results.

## Gotchas

- **Not-found is NOT an error.** Returns `[]` with maxLevel 31, not null/VOID. Don't check maxLevel to detect "not found" — it's the same as success.
- **Duplicate names:** returns only the FIRST match (earliest creation order).
- **Instance as owner returns expanded-tree children.** These have DIFFERENT IDs than the template's children. Template child ID 115 becomes expanded-tree child ID 118 under the instance.
- **Direct children only.** Not recursive — root only sees immediate children, not grandchildren nested in sub-assembly instances.
- **Assembly templates are valid owners.** The error message says valid types are `["assembly","instance"]` — assembly templates count as "assembly" type.

## Common Errors

| Error | Cause |
|---|---|
| "wrong id type! Provide only following id types: [\"assembly\",\"instance\"]" | Passed a part template ID |
| "ToId()/TOID() didn't get an existing or valid id" + "invalid id!" | Nonexistent ID |
| "Set the parameter \"ownerId\" = VOID is not allowed" | Passed null/VOID as ownerId |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
const i2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'B' })).result

// Get all
const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
// → [i1, i2]

// Get by name
const one = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'B' })).result
// → i2 (raw number)

// Not found — graceful
const none = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'X' })).result
// → [] (empty array, no error)

// Batch
const batch = (await api.v1.assembly.getInstance([
  { ownerId: asmId, name: 'A' },
  { ownerId: asmId, name: 'X' },
])).result
// → [i1, []]
```

## Related

- `assembly.instance` — create instances
- `assembly.deleteInstance` — remove instances
- `assembly.setCurrentProduct` — switch context to template for editing
