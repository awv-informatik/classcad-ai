# assembly.loadProduct

Loads a product from data, file, or URL into an existing assembly as a template. The loaded product is added to the appropriate container (PartContainer for parts, AssemblyContainer for assemblies) and can then be instantiated with `assembly.instance`. Does NOT auto-instantiate.

## Prerequisites

- `assembly.create` must have been called first. Without it: error "Assembly building is not initialized!" (maxLevel=51).

## Key Parameters

- **Source** (pick one):
  - `data` — content string (from `common.save` or `assembly.exportNode`)
  - `file` — absolute path on the ClassCAD server's filesystem
  - `url` — URL to fetch the file from
  - If none provided: error "Either data, file or url must be provided to load content from."
- `format` — `'OFB'` (default) or `'STP'` only. **IWP, STL, SCG are NOT supported** (unlike `common.load` which also accepts IWP). Error: "The provided value for parameter \"format\" is not valid. Possible values are: [\"OFB\",\"STP\"]"
- `encoding` — `'base64'`. Must match the encoding used on save.
- `compression` — `'deflate'`. Must match the compression used on save.
- `ident` — custom string identifier. Stored in the assembly's `IdentToIdMap` as `[identString, templateId]` pairs. Useful for external systems to look up templates.

## Return Value

```js
{
  result: { id: 22 },  // template ID (CC_Part in PartContainer, or assembly template in AssemblyContainer)
  messages: [],
  maxLevel: 31          // 31=success, 51=error
}
```

- `result.id` — the template ID. Use this with `assembly.instance({ productId: id, ... })`.
- On failure: `result: null`, maxLevel=51.

## Behavior

- **Adds to container, does NOT instantiate.** The loaded product becomes a template — you must call `assembly.instance` to place it in the assembly.
- **Does NOT switch `currentProduct`.** After `loadProduct`, context remains on the assembly root.
- **Part OFBs → CC_PartContainer.** Queryable via `getPartTemplate({ name })`. Instantiable by name or ID.
- **Assembly OFBs → CC_AssemblyContainer.** Queryable via `getAssemblyTemplate({ name })`, NOT `getPartTemplate`. Instantiable as a sub-assembly.
- **Original part name preserved.** If the saved part was named "Plate", the loaded template retains that name.
- **IDs shift.** Even with OFB, absolute IDs change when loaded into an assembly context (the internal structure is preserved, but node IDs are renumbered).
- **Multiple loads work.** Call `loadProduct` multiple times to import different products into the same assembly.

## Work Geometry Access

Work geometry (work planes, axes, coordinate systems) IS preserved in loaded templates, but the access pattern matters:

| Method | On template | On instance | On assembly root |
|---|---|---|---|
| `part.getWorkGeometry` | ✅ works | - | - |
| `assembly.getWorkGeometry` | ❌ fails | ✅ works | ✅ works |

Use `part.getWorkGeometry({ id: tplId, name: 'MyCSys' })` to find work geometry on a loaded template (e.g., for constraint mates).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Assembly building is not initialized!" | No `assembly.create` | Call `assembly.create` first |
| "Either data, file or url must be provided..." | No source | Provide `data`, `file`, or `url` |
| "format is not valid. Possible values are: [\"OFB\",\"STP\"]" | Unsupported format | Use OFB or STP only |
| "Nothing could be found to import!" | Empty or corrupt data | Check data string |
| "Only loading drawings with one single root product is supported." | Format mismatch or multi-root file | Match format to data |

## Gotchas

- **Only OFB and STP.** Unlike `common.load` which also accepts IWP, `loadProduct` only supports two formats.
- **No auto-instantiation.** Unlike some CAD systems, loading a product does not place it in the assembly — you must explicitly instantiate.
- **IDs shift on load.** Don't hardcode IDs from the original save. Use the returned `result.id` and discover child IDs via `part.getWorkGeometry`, `getPartTemplate`, etc.
- **`ident` is stored, not queryable via API.** The ident string is stored in `IdentToIdMap` in the structure tree, but there's no API to look up a template by ident. Use `getPartTemplate({ name })` for lookup.
- **Format mismatch gives unhelpful error.** Loading OFB data with `format: 'STP'` produces "Only loading drawings with one single root product is supported" rather than a specific "wrong format" message.

## Working Example

```js
// Save a part
const partId = (await api.v1.part.create({ name: 'Bracket' })).result
await api.v1.part.box({ id: partId, name: 'Body', length: 60, width: 40, height: 20 })
const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

// Create assembly and load the part as a template
await api.v1.common.clear({})
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result
const tplId = (await api.v1.assembly.loadProduct({
  data: saved.result.content,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
  ident: 'bracket-v1',
})).result.id

// Instantiate
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({
  productId: tplId,  // or 'Bracket' (by name)
  ownerId: asmId,
  transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result
```

## loadProduct vs common.load

| Aspect | `assembly.loadProduct` | `common.load` |
|---|---|---|
| Purpose | Import product as template into existing assembly | Replace entire drawing with loaded content |
| Requires | `assembly.create` first | Empty drawing or `doClear: 1` |
| Clears drawing? | No | Yes (or requires pre-clear) |
| Formats | OFB, STP | OFB, STP, IWP |
| Returns | Template ID (`{ id }`) | Root product ID (`{ id }`) |
| Use case | Building assemblies from pre-made parts | Loading a complete model |

## Related

- `assembly.exportNode` — export a template or instance as OFB/STP (pairs with loadProduct for roundtrip)
- `assembly.partTemplate` — create a blank part template (alternative to loading pre-made)
- `assembly.assemblyTemplate` — create a blank assembly template
- `assembly.instance` — instantiate a loaded template
- `assembly.getPartTemplate` / `assembly.getAssemblyTemplate` — find loaded templates by name
- `common.load` — load a complete model (replaces drawing)
- `common.save` — save the entire drawing (use with loadProduct for part import)
