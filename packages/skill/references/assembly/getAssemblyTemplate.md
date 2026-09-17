# assembly.getAssemblyTemplate

Retrieves assembly templates from the AssemblyContainer — all of them, or one by exact name.

## Key Parameters

- `name` — optional, exact and case-sensitive. Omitted → all assembly templates

## Return Value

| Call | Result | maxLevel |
|---|---|---|
| `getAssemblyTemplate()` / `getAssemblyTemplate({})` | `Array<id>` in creation order (ascending ID, not alphabetical) — always an array, even for 0 or 1 | 31 |
| `{ name: 'X' }` found | `id` (single number, never an array) | 31 |
| `{ name: 'X' }` not found | `null` | 51 |

## Gotchas

- **Names are SANITIZED.** `assemblyTemplate` replaces non-alphanumeric characters (spaces, parens, hyphens) with underscores; look up by the sanitized name. `assemblyTemplate({ name: 'My Sub (v2)' })` stores `'My_Sub__v2_'`. (`partTemplate` preserves special chars verbatim.)
- **Exact match only.** `'Alpha'` works; `'alpha'`, `'ALPHA'`, `'Alp'` → null/51.
- **Empty-string name works:** `{ name: '' }` finds a template created with `assemblyTemplate({ name: '' })`.
- **Scoped to AssemblyContainer.** Part templates are invisible here and vice versa; same-named templates in different containers don't interfere.
- **Deduplicated names are addressable.** Three `assemblyTemplate({ name: 'Motor' })` calls create "Motor", "Motor0", "Motor1"; `{ name: 'Motor0' }` finds the second.
- **Live:** `deleteTemplate` removes it from listing and name lookup immediately. After `convertToTemplate({ name: 'X' })` the former root (keeping its original ID) is findable here as `'X'`.
- **No assembly required:** without `assembly.create`, listing returns `[]` (31) and name lookup null (51), no crash.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Bracket' })).result
const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Table' })).result

const all = (await api.v1.assembly.getAssemblyTemplate()).result  // [t1, t2]
const bracketId = (await api.v1.assembly.getAssemblyTemplate({ name: 'Bracket' })).result  // t1
```

## Related

`assembly.getPartTemplate` · `assembly.assemblyTemplate` · `assembly.deleteTemplate` · `assembly.convertToTemplate` · `assembly.instance`
