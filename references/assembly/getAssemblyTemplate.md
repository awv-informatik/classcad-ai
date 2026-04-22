# assembly.getAssemblyTemplate

Finds assembly templates by name or lists all assembly templates in the AssemblyContainer. Two modes: name lookup (single result) or list-all (array result).

## Prerequisites

- None. Works even without `assembly.create` — returns empty array gracefully. No crash, no error on listing.

## Key Parameters

- `name` (string, optional) — exact name of the assembly template to find.
  - **Case-sensitive, exact match only.** No partial matching, no case-insensitive search.
  - Omit (or pass `{}` or `undefined`) to list all templates.
  - Empty string `''` works — finds a template created with `assemblyTemplate({ name: '' })`.
  - **Matches against the sanitized display name**, not `originalName`. Special characters (spaces, parens, slashes) are sanitized to underscores by `assemblyTemplate`, so use the sanitized form: `'My_Sub__v2_'` not `'My Sub (v2)'`. This differs from `getPartTemplate`, where special chars are preserved.
  - Deduped names (e.g., "Motor0", "Motor1") are found by their actual deduped name, not the originally requested name.

## Return Value

**Two distinct return shapes depending on call mode:**

| Call | Result type | On success | On failure |
|---|---|---|---|
| `getAssemblyTemplate()` | `Array<id>` | Array of all template IDs (may be empty `[]`) | N/A — always succeeds |
| `getAssemblyTemplate({ name })` | `id` (number) | Single numeric ID | `null` |

- **List-all** always returns an array — even with 1 template: `[22]`, not `22`.
- **Name lookup** returns a bare number, not wrapped in an array.
- `maxLevel` = 31 (info) on success. 51 (error) when name not found.
- Error message on not-found: `"Assembly with name = \"X\" could not be found"`

## Ordering

The array from list-all is ordered by **creation order** (ascending ID). Not alphabetical. Stable across repeated calls.

## Gotchas

- **No assembly required for listing.** `getAssemblyTemplate()` returns `[]` without `assembly.create`. But name lookup returns `null` with error (nothing to search).
- **Scoped to AssemblyContainer only.** Will not find part templates — use `getPartTemplate` for those. No cross-contamination between containers.
- **Reflects deletions immediately.** After `deleteTemplate({ ids: [X] })`, the deleted template vanishes from both listing and name lookup.
- **Templates persist after instancing.** Creating instances from a template does not remove it from the listing.
- **Uses sanitized names.** Unlike `getPartTemplate`, special characters in names are replaced with underscores by `assemblyTemplate`. You must search by the sanitized form.
- **`convertToTemplate` results appear.** Templates created by `convertToTemplate({ name })` are findable by name and appear in list-all. The converted template keeps its original numeric ID.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

await api.v1.assembly.assemblyTemplate({ name: 'Gearbox' })
await api.v1.assembly.assemblyTemplate({ name: 'Chassis' })
await api.v1.assembly.assemblyTemplate({ name: 'Drivetrain' })

// Find by name
const gearboxId = (await api.v1.assembly.getAssemblyTemplate({ name: 'Gearbox' })).result
// gearboxId → 22 (number, not array)

// List all
const allIds = (await api.v1.assembly.getAssemblyTemplate()).result
// allIds → [22, 32, 42] (always array)

// Not found
const missing = await api.v1.assembly.getAssemblyTemplate({ name: 'Nope' })
// missing.result → null, missing.maxLevel → 51
```

## Related

- `assembly.assemblyTemplate` — create assembly templates (what this API queries)
- `assembly.getPartTemplate` — same pattern for part templates (but preserves special chars in names)
- `assembly.deleteTemplate` — delete templates by ID array (deletions reflected immediately)
- `assembly.convertToTemplate` — demote root assembly to template (result becomes findable here)
- `assembly.instance` — instantiate found templates in the assembly tree
