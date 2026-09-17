# assembly.assemblyTemplate

Creates a sub-assembly template — a `CC_Assembly` node in `CC_AssemblyContainer` — for nested, reusable structures (e.g. a "Table" of base plate + 4 legs instantiated several times in the root). Its internal structure (`ExpressionSet`, `ConstraintSet`, `GeometrySet`) is identical to `CC_AssemblyRoot`: a full assembly context.

## Prerequisites

`assembly.create` first. Without it: "Assembly building is not initialized!" (maxLevel 51).

## Key Parameters

- `name` — optional, default `"Assembly"`. Duplicates are auto-deduplicated: three `'Motor'` calls create "Motor", "Motor0", "Motor1" (findable by those stored names via `getAssemblyTemplate`)

## Return Value

ID of the `CC_Assembly` node (maxLevel 31); failure → null, maxLevel 51.

## Building a Sub-Assembly

`assemblyTemplate` does **not** switch `currentProduct` (it stays on whatever was current, typically the root). `assembly.*` calls with explicit IDs (`instance({ ownerId: subAsmId })`) work regardless.

1. `assemblyTemplate({ name })` → subAsmId
2. `setCurrentProduct({ id: subAsmId })` to build inside it
3. Create/reuse part templates and build their geometry
4. `instance({ productId: tplId, ownerId: subAsmId })`
5. `setCurrentProduct({ id: asmId })`
6. `instance({ productId: subAsmId, ownerId: asmId })`

## Gotchas

- **Part templates are GLOBAL.** `partTemplate` from any context stores into `CC_PartContainer`; `getPartTemplate({})` returns the same list regardless of `currentProduct`; any part template can be instanced in any (sub-)assembly.
- **Nesting is unlimited**; transform composition is correct at 3+ levels. Sub-assembly instance COG = sum of parent transform origins + weighted local COG of its parts. Example: Plate (40×30×10, COG (20,15,5)) at inner offset (20,0,0), sub-assembly instance at (0,80,0) → COG (40,95,5).

## Structure Tree

```
AllObjects (id=1)
├── CC_PartContainer (id=8)
│   └── CC_Part "Plate" (id=32)       ← part template
├── CC_AssemblyContainer (id=10)
│   └── CC_Assembly "Bracket" (id=22)  ← assembly template
│       ├── CC_ExpressionSet (id=24)
│       ├── CC_ConstraintSet (id=26)
│       ├── CC_GeometrySet (id=28)
│       └── CC_ProductReference (id=123, link=32)  ← "Plate" inside sub-assembly
└── CC_AssemblyRoot (id=12)
    └── CC_ProductReference (id=125, link=22)  ← "Bracket" in root
```

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

const baseTpl = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: baseTpl, name: 'Body', length: 80, width: 60, height: 10 })
const pillarTpl = (await api.v1.assembly.partTemplate({ name: 'Pillar' })).result
await api.v1.part.cylinder({ id: pillarTpl, name: 'Rod', height: 50, diameter: 15 })

const tableSub = (await api.v1.assembly.assemblyTemplate({ name: 'Table' })).result
await api.v1.assembly.setCurrentProduct({ id: tableSub })
await api.v1.assembly.instance({ productId: baseTpl, ownerId: tableSub })
await api.v1.assembly.instance({
  productId: pillarTpl, ownerId: tableSub,
  transformation: [[10, 10, 10], [1, 0, 0], [0, 1, 0]],
})

await api.v1.assembly.setCurrentProduct({ id: asmId })
await api.v1.assembly.instance({ productId: tableSub, ownerId: asmId, name: 'Table1' })
await api.v1.assembly.instance({
  productId: tableSub, ownerId: asmId, name: 'Table2',
  transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
})
```

## Related

`assembly.partTemplate` · `assembly.getAssemblyTemplate` · `assembly.deleteTemplate` · `assembly.instance` · `assembly.setCurrentProduct` · `assembly.convertToTemplate`
