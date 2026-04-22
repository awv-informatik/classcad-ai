# assembly.getPartTemplate

Finds part templates by name or lists all part templates in the PartContainer. Two modes: name lookup (single result) or list-all (array result).

## Prerequisites

- None. Works even without `assembly.create` — returns empty array gracefully. No crash, no error on listing.

## Key Parameters

- `name` (string, optional) — exact name of the part template to find.
  - **Case-sensitive, exact match only.** No partial matching, no case-insensitive search.
  - Omit (or pass `{}` or `undefined`) to list all templates.
  - Empty string `''` works — finds a template created with `partTemplate({ name: '' })`. (Unlike `getAssemblyTemplate`, which fails on empty name.)
  - Deduplicated names (e.g., "Bolt0", "Bolt1") are found by their actual name, not the originally requested name.

## Return Value

**Two distinct return shapes depending on call mode:**

| Call | Result type | On success | On failure |
|---|---|---|---|
| `getPartTemplate()` | `Array<id>` | Array of all template IDs (may be empty `[]`) | N/A — always succeeds |
| `getPartTemplate({ name })` | `id` (number) | Single numeric ID | `null` |

- **List-all** always returns an array — even with 1 template: `[22]`, not `22`.
- **Name lookup** returns a bare number, not wrapped in an array.
- `maxLevel` = 31 (info) on success. 51 (error) when name not found.
- Error message on not-found: `"Part with name = \"X\" could not be found"`

## Ordering

The array from list-all is ordered by **creation order** (ascending ID). Not alphabetical. Stable across repeated calls.

## Gotchas

- **No assembly required for listing.** `getPartTemplate()` returns `[]` without `assembly.create`. But name lookup returns `null` with error (nothing to search).
- **Scoped to PartContainer only.** Will not find assembly templates — use `getAssemblyTemplate` for those. No cross-contamination between containers.
- **Reflects deletions immediately.** After `deleteTemplate({ ids: [X] })`, the deleted template vanishes from both listing and name lookup.
- **Templates persist after instancing.** Creating instances from a template does not remove it from the listing.
- **Special characters in names work.** Spaces, parens, slashes are all preserved verbatim and matchable (consistent with `partTemplate`'s no-sanitization behavior).

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

await api.v1.assembly.partTemplate({ name: 'Bracket' })
await api.v1.assembly.partTemplate({ name: 'Shaft' })
await api.v1.assembly.partTemplate({ name: 'Housing' })

// Find by name
const bracketId = (await api.v1.assembly.getPartTemplate({ name: 'Bracket' })).result
// bracketId → 22 (number, not array)

// List all
const allIds = (await api.v1.assembly.getPartTemplate()).result
// allIds → [22, 68, 114] (always array)

// Not found
const missing = await api.v1.assembly.getPartTemplate({ name: 'Nope' })
// missing.result → null, missing.maxLevel → 51
```

## Related

- `assembly.partTemplate` — create part templates (what this API queries)
- `assembly.getAssemblyTemplate` — same pattern for assembly templates (but fails on empty name)
- `assembly.deleteTemplate` — delete templates by ID array (deletions reflected immediately)
- `assembly.instance` — instantiate found templates in the assembly tree
