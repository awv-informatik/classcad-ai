# assembly.getPartTemplate

Retrieves part templates from the PartContainer — either all of them or one by exact name.

## Prerequisites

- None. Works even without `assembly.create` (returns empty array).

## Key Parameters

- `name` — (optional) Exact name of the template to find. Case-sensitive. If omitted, returns all part templates.

## Return Value

**Two distinct return shapes:**

| Call | Result | maxLevel |
|---|---|---|
| `getPartTemplate()` or `getPartTemplate({})` | `Array<id>` — all template IDs, creation order | 31 |
| `getPartTemplate({ name: 'X' })` — found | `id` (single number) | 31 |
| `getPartTemplate({ name: 'X' })` — not found | `null` | 51 |

The listing mode **always** returns an array, even with 0 or 1 templates. The name mode **always** returns a single number or null — never an array.

## Gotchas

- **Case-sensitive, exact match only.** `'Alpha'` works; `'alpha'`, `'ALPHA'`, `'Alp'` all fail with null/maxLevel=51. No fuzzy or partial matching.
- **Empty-string name works.** `getPartTemplate({ name: '' })` finds a template created with `partTemplate({ name: '' })`. This differs from `getAssemblyTemplate` which reportedly fails on empty names.
- **Scoped to PartContainer only.** Assembly templates (from `assemblyTemplate`) are invisible to `getPartTemplate`, and vice versa. No cross-contamination.
- **Deduplicated names are individually addressable.** Three calls to `partTemplate({ name: 'Bolt' })` create "Bolt", "Bolt0", "Bolt1". `getPartTemplate({ name: 'Bolt0' })` finds the second one.
- **Live query after deletion.** `deleteTemplate({ ids: [id] })` is immediately reflected — the deleted template vanishes from both listing and name lookup.
- **Ordering is creation order** (ascending ID), not alphabetical. Stable across repeated calls.
- **Templates persist after instancing.** Creating instances does not remove templates from the listing.
- **No assembly required for listing.** Without `assembly.create`, `getPartTemplate()` returns `[]` (maxLevel=31). Name lookup returns null (maxLevel=51). No crash.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

const t1 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
const t2 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result

// List all
const all = (await api.v1.assembly.getPartTemplate()).result
// all = [t1, t2] — Array<id>, creation order

// Find by name
const bracketId = (await api.v1.assembly.getPartTemplate({ name: 'Bracket' })).result
// bracketId = t1 — single number

// Use for instancing
const inst = (await api.v1.assembly.instance({ productId: bracketId, ownerId: asmId })).result
```

## Related

- `assembly.getAssemblyTemplate` — same pattern for assembly templates (searches AssemblyContainer)
- `assembly.partTemplate` — create a new part template
- `assembly.deleteTemplate` — remove templates (immediately reflected in getPartTemplate)
- `assembly.instance` — instantiate a template (accepts the ID returned by getPartTemplate)
