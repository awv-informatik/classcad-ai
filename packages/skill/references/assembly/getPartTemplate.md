# assembly.getPartTemplate

Retrieves part templates from the PartContainer — all of them, or one by exact name.

## Key Parameters

- `name` — optional, exact and case-sensitive. Omitted → all part templates

## Return Value

| Call | Result | maxLevel |
|---|---|---|
| `getPartTemplate()` / `getPartTemplate({})` | `Array<id>` in creation order (ascending ID, not alphabetical) — always an array, even for 0 or 1 | 31 |
| `{ name: 'X' }` found | `id` (single number, never an array) | 31 |
| `{ name: 'X' }` not found | `null` | 51 |

## Gotchas

- **Exact match only.** `'Alpha'` works; `'alpha'`, `'ALPHA'`, `'Alp'` → null/51.
- **Empty-string name works:** `{ name: '' }` finds a template created with `partTemplate({ name: '' })` (`getAssemblyTemplate` reportedly fails on empty names).
- **Scoped to PartContainer.** Assembly templates are invisible here, and vice versa.
- **Deduplicated names are addressable.** Three `partTemplate({ name: 'Bolt' })` calls create "Bolt", "Bolt0", "Bolt1"; `{ name: 'Bolt0' }` finds the second.
- **Live:** `deleteTemplate` removes the template from listing and name lookup immediately. Instancing does not remove templates.
- **No assembly required:** without `assembly.create`, listing returns `[]` (31) and name lookup null (51), no crash.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const t1 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
const t2 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result

const all = (await api.v1.assembly.getPartTemplate()).result  // [t1, t2]
const bracketId = (await api.v1.assembly.getPartTemplate({ name: 'Bracket' })).result  // t1
```

## Related

`assembly.getAssemblyTemplate` · `assembly.partTemplate` · `assembly.deleteTemplate` · `assembly.instance`
