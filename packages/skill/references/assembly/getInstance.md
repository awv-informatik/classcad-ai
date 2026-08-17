# assembly.getInstance

Queries instances from an owner (assembly root, assembly template, or instance).

## Prerequisites

- An assembly with instances already created

## Key Parameters

- `ownerId` — **required**. The parent to search. Must be assembly root, assembly template, or instance ID. Also accepts string name (e.g., `'AssemblyRoot'`).
- `name` — optional. If provided, returns the single matching instance. If omitted, returns ALL instances of the owner.

## Return Value

The return type depends on the query:

| Query | Result type | Example |
|---|---|---|
| `{ ownerId, name: 'Foo' }` | `id` (single) | `107` |
| `{ ownerId }` (no name) | `Array<id>` | `[105, 107, 109]` |
| Array form `[{...}, {...}]` | `Array<id>` | `[105, 109]` |
| Name not found | `[]` (empty array) | `[]` |

**Important:** name-match returns a bare `id`, not a 1-element array.

## Gotchas

- **Nonexistent name returns `[]`**, not null, not error. maxLevel=31 (success). Check `.length` to detect "not found."
- **Template vs expanded tree IDs differ.** Querying from a template returns CC_ProductReference IDs (template-scope). Querying from an instance of that template returns CC_ProductReferenceET IDs (expanded-tree-scope). These are different numeric IDs for the same logical instances.
- **Cannot query by `ident`.** The `ident` field set at instance creation is not searchable via getInstance.
- **ownerId must be assembly/instance type.** Part template IDs are rejected (error 1001).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"ownerId" must be provided` | 1004 | Missing ownerId param |
| `"ownerId" has a wrong id type` | 1001 | Part template or other non-assembly ID |

## Working Example

```js
// Get all instances
const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
// → [105, 107, 109]

// Get by name
const beta = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Beta' })).result
// → 107

// Array form
const [a, c] = (await api.v1.assembly.getInstance([
  { ownerId: asmId, name: 'Alpha' },
  { ownerId: asmId, name: 'Gamma' },
])).result
// → [105, 109]

// Check from sub-assembly instance
const children = (await api.v1.assembly.getInstance({ ownerId: subAsmInst })).result
// → expanded-tree IDs (different from template-tree IDs)
```

## Related

- `assembly.instance` — create instances
- `assembly.deleteInstance` — remove instances
