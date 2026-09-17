# assembly.getInstance

Queries instances of an owner (assembly root, assembly template, or instance).

## Key Parameters

- `ownerId` — **required**. Assembly root, assembly template, or instance ID; a string name (e.g. `'AssemblyRoot'`) also works. Part template IDs are rejected (1001)
- `name` — optional. Given → the single matching instance; omitted → ALL instances of the owner

## Return Value

| Query | Result | Example |
|---|---|---|
| `{ ownerId, name: 'Foo' }` | bare `id` (not a 1-element array) | `107` |
| `{ ownerId }` | `Array<id>` | `[105, 107, 109]` |
| Array form `[{...}, {...}]` | `Array<id>` | `[105, 109]` |
| Name not found | `[]` — not null, not an error (maxLevel 31); check `.length` | `[]` |

## Gotchas

- **Template vs expanded-tree IDs differ.** Querying a template returns CC_ProductReference IDs (template scope); querying an instance of that template returns CC_ProductReferenceET IDs (expanded tree). Different numeric IDs for the same logical instances.
- **Cannot query by `ident`** set at instance creation.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"ownerId" must be provided` | 1004 | Missing ownerId |
| `"ownerId" has a wrong id type` | 1001 | Part template or other non-assembly ID |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'Box', length: 20, width: 20, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })
for (const name of ['Alpha', 'Beta', 'Gamma'])
  await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name })

const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result            // [a, b, c]
const beta = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Beta' })).result  // single id
const [a, c] = (await api.v1.assembly.getInstance([
  { ownerId: asmId, name: 'Alpha' },
  { ownerId: asmId, name: 'Gamma' },
])).result
```

## Related

`assembly.instance` · `assembly.deleteInstance`
