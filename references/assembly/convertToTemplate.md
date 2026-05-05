# assembly.convertToTemplate

Converts the current root assembly into an assembly template and creates a new root assembly above it. The old root becomes a reusable sub-assembly template.

## Prerequisites

- An assembly must exist (`assembly.create` called first)
- The drawing must be in assembly context (not part context)

## Key Parameters

- `name` (optional) — name for the converted template. Default: `"Subassembly"`. Empty string `''` is allowed. Names are NOT deduplicated — duplicates are permitted but cause lookup issues.

## Return Value

Returns VOID (`null`). maxLevel=31 on success.

The old root assembly ID becomes the converted template's ID. A new root is created with a higher ID. Both `structure.root` and `structure.currentProduct` update to the new root.

## Spatial Behavior

Instance transforms inside the old root are preserved exactly. When you instance the converted template, internal offsets compose additively with the new instance's transform:

```
world_COG = instance_transform + internal_instance_offset + local_body_COG
```

Verified numerically: box at local [20,10,5] + internal offset [50,30,20] + outer offset [100,0,0] → COG [170,40,25] — exact match.

## Gotchas & Dead Ends

- **Name collisions:** Duplicate names are allowed (no error). But `getAssemblyTemplate({ name })` returns the first match — if a template with that name already existed, the converted template becomes unreachable by name. Track the ID (= old root ID) directly.
- **Part context:** Calling when no assembly exists → maxLevel=51, "Assembly building is not initialized!"
- **State after `part.create`:** If `part.create` was called in the same session before `assembly.create`, the first `convertToTemplate` may fail with maxLevel=51 due to residual internal state. A clean `assembly.create` session works fine.
- **Empty assemblies:** Convert successfully. The empty template can have instances added later via `setCurrentProduct`.

## Common Patterns

**Build hierarchy from bottom up:**
```js
const asmId = (await api.v1.assembly.create({})).result
// ... build sub-assembly content ...
await api.v1.assembly.convertToTemplate({ name: 'Level1' })
// Now at new root — instance Level1 or keep building
```

**Chain conversions for nesting:**
```js
await api.v1.assembly.convertToTemplate({ name: 'Inner' })
// Inner is now a template, current root is empty
await api.v1.assembly.convertToTemplate({ name: 'Outer' })
// Outer wraps Inner, new root created above both
```

**Modify after conversion:**
```js
const convertedId = (await api.v1.assembly.getAssemblyTemplate({ name: 'Sub' })).result
await api.v1.assembly.setCurrentProduct({ id: convertedId })
// Now inside the template — add/remove instances, modify content
await api.v1.assembly.setCurrentProduct({ id: newRoot }) // return to root
```

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 60, width: 40, height: 30 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Inst1',
  transformation: [[25, 15, 10], [1, 0, 0], [0, 1, 0]],
})

// Convert — old root (12) becomes template, new root created
const r = await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })
// r.result = null, r.maxLevel = 31
const newRoot = r.structure.root // e.g. 137

// Instance the converted template
const convertedId = (await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })).result
await api.v1.assembly.instance({ productId: convertedId, ownerId: newRoot })
```

## Related

- `assembly.assemblyTemplate` — creates a fresh empty assembly template (vs. converting existing root)
- `assembly.deleteTemplate` — deletes converted templates (cascade-deletes instances)
- `assembly.getAssemblyTemplate` — find the converted template by name or list all
- `assembly.setCurrentProduct` — switch into/out of the converted template to modify it
- `assembly.instance` — instantiate the converted template into the new root
