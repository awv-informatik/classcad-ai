# assembly.loadProduct

Loads a product from data, file, or URL into an existing assembly **as a template** — part OFBs go to `CC_PartContainer` (find via `getPartTemplate`), assembly OFBs to `CC_AssemblyContainer` (find via `getAssemblyTemplate`, NOT `getPartTemplate`; instantiable as a sub-assembly). Does NOT instantiate and does NOT switch `currentProduct`. Can be called repeatedly to import several products.

## Prerequisites

`assembly.create` first. Without it: "Assembly building is not initialized!" (maxLevel 51).

## Key Parameters

- Source, one of: `data` (string from `common.save` or `assembly.exportNode`), `file` (absolute path on the ClassCAD server), `url`. None → "Either data, file or url must be provided to load content from."
- `format` — `'OFB'` (default) or `'STP'` only. IWP, STL, SCG are NOT supported (unlike `common.load`, which also accepts IWP)
- `encoding` — `'base64'`; `compression` — `'deflate'`. Both must match what was used on save
- `ident` — string stored in the assembly's `IdentToIdMap` as `[identString, templateId]`, for external systems. No API looks templates up by ident — use `getPartTemplate({ name })`

## Return Value

`{ result: { id }, maxLevel: 31 }` — `id` is the template ID for `assembly.instance({ productId: id })`. Failure → `result: null`, maxLevel 51.

## Behavior

- **Original name preserved** — a part saved as "Plate" loads as template "Plate" (instantiable by name or ID).
- **IDs shift** — even with OFB, node IDs are renumbered on load (structure preserved). Don't hardcode IDs from the original; use `result.id` and discover children via `part.getWorkGeometry`, `getPartTemplate`, etc.
- **Work geometry is preserved**, but access depends on the target:

| Method | On template | On instance | On assembly root |
|---|---|---|---|
| `part.getWorkGeometry` | ✅ | - | - |
| `assembly.getWorkGeometry` | ❌ | ✅ | ✅ |

## Common Errors

| Error | Cause |
|---|---|
| "Assembly building is not initialized!" | No `assembly.create` |
| "Either data, file or url must be provided..." | No source |
| "format is not valid. Possible values are: [\"OFB\",\"STP\"]" | Unsupported format |
| "Nothing could be found to import!" | Empty or corrupt data |
| "Only loading drawings with one single root product is supported." | Multi-root file, or format mismatch (e.g. OFB data with `format: 'STP'` — no specific "wrong format" message) |

## loadProduct vs common.load

| Aspect | `assembly.loadProduct` | `common.load` |
|---|---|---|
| Purpose | Import a product as template into an existing assembly | Replace the entire drawing |
| Requires | `assembly.create` first | Empty drawing or `doClear: 1` |
| Clears drawing? | No | Yes (or requires pre-clear) |
| Formats | OFB, STP | OFB, STP, IWP |
| Returns | Template ID (`{ id }`) | Root product ID (`{ id }`) |

## Working Example

```js
// Save a part
const partId = (await api.v1.part.create({ name: 'Bracket' })).result
await api.v1.part.box({ id: partId, name: 'Body', length: 60, width: 40, height: 20 })
const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

// Load it as a template into a new assembly
await api.v1.common.clear({})
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result
const tplId = (await api.v1.assembly.loadProduct({
  data: saved.result.content, format: 'OFB', encoding: 'base64', compression: 'deflate',
  ident: 'bracket-v1',
})).result.id

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result  // or productId: 'Bracket'
```

## Related

`assembly.exportNode` · `assembly.partTemplate` · `assembly.assemblyTemplate` · `assembly.instance` · `assembly.getPartTemplate` / `assembly.getAssemblyTemplate` · `common.load` · `common.save`
