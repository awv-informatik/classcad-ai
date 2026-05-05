# assembly.getAssemblyTemplate

Retrieves assembly templates from the AssemblyContainer — either all of them or one by exact name.

## Prerequisites

- None. Works even without `assembly.create` (returns empty array).

## Key Parameters

- `name` — (optional) Exact name of the template to find. Case-sensitive. If omitted, returns all assembly templates.

## Return Value

**Two distinct return shapes:**

| Call | Result | maxLevel |
|---|---|---|
| `getAssemblyTemplate()` or `getAssemblyTemplate({})` | `Array<id>` — all template IDs, creation order | 31 |
| `getAssemblyTemplate({ name: 'X' })` — found | `id` (single number) | 31 |
| `getAssemblyTemplate({ name: 'X' })` — not found | `null` | 51 |

The listing mode **always** returns an array, even with 0 or 1 templates. The name mode **always** returns a single number or null — never an array.

## Gotchas

- **Names are SANITIZED.** `assemblyTemplate` replaces non-alphanumeric characters (spaces, parens, hyphens) with underscores. You must look up templates by their **sanitized** name, not the name you originally requested. Example: `assemblyTemplate({ name: 'My Sub (v2)' })` stores as `'My_Sub__v2_'` — look up with that. This differs from `partTemplate`, which preserves special chars verbatim.
- **Case-sensitive, exact match only.** `'Alpha'` works; `'alpha'`, `'ALPHA'`, `'Alp'` all fail with null/maxLevel=51. No fuzzy or partial matching.
- **Empty-string name works.** `getAssemblyTemplate({ name: '' })` finds a template created with `assemblyTemplate({ name: '' })`.
- **Scoped to AssemblyContainer only.** Part templates (from `partTemplate`) are invisible to `getAssemblyTemplate`, and vice versa. Same-named templates in different containers don't interfere.
- **Deduplicated names are individually addressable.** Three calls to `assemblyTemplate({ name: 'Motor' })` create "Motor", "Motor0", "Motor1". `getAssemblyTemplate({ name: 'Motor0' })` finds the second one.
- **Live query after deletion.** `deleteTemplate({ ids: [id] })` is immediately reflected — the deleted template vanishes from both listing and name lookup.
- **Ordering is creation order** (ascending ID), not alphabetical. Stable across repeated calls.
- **`convertToTemplate` results appear here.** After `convertToTemplate({ name: 'X' })`, the former root assembly (keeping its original ID) becomes findable by the new name in this listing.
- **No assembly required for listing.** Without `assembly.create`, `getAssemblyTemplate()` returns `[]` (maxLevel=31). Name lookup returns null (maxLevel=51). No crash.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Bracket' })).result
const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Table' })).result

// List all
const all = (await api.v1.assembly.getAssemblyTemplate()).result
// all = [t1, t2] — Array<id>, creation order

// Find by name
const bracketId = (await api.v1.assembly.getAssemblyTemplate({ name: 'Bracket' })).result
// bracketId = t1 — single number

// Use for instancing
const inst = (await api.v1.assembly.instance({ productId: bracketId, ownerId: asmId })).result
```

## Related

- `assembly.getPartTemplate` — same pattern for part templates (searches PartContainer)
- `assembly.assemblyTemplate` — create a new assembly template
- `assembly.deleteTemplate` — remove templates (immediately reflected in getAssemblyTemplate)
- `assembly.convertToTemplate` — convert root assembly into a template (appears in listing)
- `assembly.instance` — instantiate a template (accepts the ID returned by getAssemblyTemplate)
