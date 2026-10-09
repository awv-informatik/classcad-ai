# assembly.convertToTemplate

Converts the current root assembly into an assembly template (a reusable sub-assembly) and creates a new root assembly above it.

Prerequisites: an assembly exists (`assembly.create`) and the drawing is in assembly context. Otherwise → maxLevel 51, "Assembly building is not initialized!"

## Key Parameters

- `name` — optional, default `"Subassembly"`. `''` allowed. Names are NOT deduplicated

## Return Value

VOID (`null`), maxLevel 31. The old root ID becomes the template's ID (class `CC_Assembly`); the new root (`CC_AssemblyRoot`) gets a higher ID and becomes the current product.

## Spatial Behavior

Instance transforms inside the old root are preserved exactly. Instancing the template composes additively:

```
world_COG = instance_transform + internal_instance_offset + local_body_COG
```

Box at local [20,10,5] + internal offset [50,30,20] + outer offset [100,0,0] → COG [170,40,25], exact.

## Usage

- **Bottom-up hierarchy:** build content, `convertToTemplate({ name: 'Level1' })`, then instance it in the new root or keep building.
- **Nesting:** `convertToTemplate({ name: 'Inner' })` then `convertToTemplate({ name: 'Outer' })` — Outer wraps Inner, new root above both.
- **Modify after conversion:** `setCurrentProduct({ id: convertedId })` to work inside the template (add/remove instances), then `setCurrentProduct` back to the new root.
- **Empty assemblies** convert fine; add instances later via `setCurrentProduct`.

## Gotchas

- **Name collisions:** duplicates raise no error, but `getAssemblyTemplate({ name })` returns the first match — if the name already existed, the converted template is unreachable by name. Track its ID (= old root ID).
- **After `part.create`:** if `part.create` was called in the session before `assembly.create`, the first `convertToTemplate` may fail (maxLevel 51) due to residual internal state. A clean `assembly.create` session works.

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

await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })  // result null, maxLevel 31
const newRoot = Object.values(await api.tree({ refresh: true })).find((n) => n.class === 'CC_AssemblyRoot').id // e.g. 107

const convertedId = (await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })).result  // === asmId
await api.v1.assembly.instance({ productId: convertedId, ownerId: newRoot })
```

## Related

`assembly.assemblyTemplate` · `assembly.deleteTemplate` · `assembly.getAssemblyTemplate` · `assembly.setCurrentProduct` · `assembly.instance`
