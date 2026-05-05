# assembly.assemblyTemplate

Creates a sub-assembly template — a `CC_Assembly` node in `CC_AssemblyContainer`. Use this to build nested, reusable assembly structures (e.g., a "Table" sub-assembly containing a base plate + 4 legs that can be instantiated multiple times in the root assembly).

## Prerequisites

- `assembly.create` must have been called first. Without it: error "Assembly building is not initialized!" (maxLevel=51).

## Key Parameters

- `name` — (optional) Name of the sub-assembly template. Default: `"Assembly"`.

## Return Value

- **Success:** `result` = numeric ID of the `CC_Assembly` node (stored in `CC_AssemblyContainer`). `maxLevel` = 31.
- **Failure:** `result` = null, `maxLevel` = 51.

## Context Behavior

- **`assemblyTemplate` does NOT switch `currentProduct`.** After calling it, context remains on whatever product was current (typically the root assembly).
- To build inside the sub-assembly (add instances), call `setCurrentProduct({ id: subAsmId })` first.
- `assembly.*` calls with explicit IDs (like `instance({ ownerId: subAsmId })`) work regardless of `currentProduct`.

## Building a Sub-Assembly

Sub-assemblies contain instances of part templates (and/or other assembly templates). The workflow:

1. Call `assemblyTemplate({ name: '...' })` — get the sub-assembly ID
2. Call `setCurrentProduct({ id: subAsmId })` — switch context
3. Create part templates with `partTemplate()` (or reuse existing ones)
4. Build geometry inside part templates (`part.box`, `part.cylinder`, etc.)
5. Instance parts inside the sub-assembly: `instance({ productId: tplId, ownerId: subAsmId })`
6. Return to root: `setCurrentProduct({ id: asmId })`
7. Instance the sub-assembly: `instance({ productId: subAsmId, ownerId: asmId })`

## Gotchas

- **Part templates are GLOBAL.** `partTemplate` called from any context always stores the part in `CC_PartContainer`. `getPartTemplate({})` returns the same list regardless of `currentProduct`. Any part template can be instanced inside any assembly or sub-assembly.
- **Duplicate names allowed.** Two templates can share a name (different IDs). `getAssemblyTemplate({ name: 'X' })` returns only the first match. Use unique names or track IDs directly.
- **Nesting is unlimited.** Assembly templates can contain instances of other assembly templates. Transform composition works correctly at arbitrary depth.

## Structure Tree

Assembly templates live in `CC_AssemblyContainer` (id=10), separate from part templates in `CC_PartContainer` (id=8):

```
AllObjects (id=1)
├── CC_PartContainer (id=8)
│   └── CC_Part "Plate" (id=32)       ← part template
├── CC_AssemblyContainer (id=10)
│   └── CC_Assembly "Bracket" (id=22)  ← assembly template
│       ├── CC_ExpressionSet (id=24)
│       ├── CC_ConstraintSet (id=26)
│       ├── CC_GeometrySet (id=28)
│       └── CC_ProductReference (id=123, link=32)  ← instance of "Plate" inside sub-assembly
└── CC_AssemblyRoot (id=12)
    └── CC_ProductReference (id=125, link=22)  ← instance of "Bracket" in root
```

The internal structure (`ExpressionSet`, `ConstraintSet`, `GeometrySet`) is identical to `CC_AssemblyRoot` — a sub-assembly is a full assembly context.

## Spatial Facts (verified)

- Instance COG of a sub-assembly = sum of all parent transform origins + weighted local COG of all parts inside.
- Example: Plate (40×30×10, COG=(20,15,5)) inside sub-assembly with inner offset (20,0,0), outer instance at (0,80,0) → COG = (40, 95, 5). Verified with `calculateMassProperties`.
- Transform composition is correct at 3+ nesting levels.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

// Create part templates
const baseTpl = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: baseTpl, name: 'Body', length: 80, width: 60, height: 10 })

const pillarTpl = (await api.v1.assembly.partTemplate({ name: 'Pillar' })).result
await api.v1.part.cylinder({ id: pillarTpl, name: 'Rod', height: 50, diameter: 15 })

// Create sub-assembly template
const tableSub = (await api.v1.assembly.assemblyTemplate({ name: 'Table' })).result

// Populate it: instance parts inside
await api.v1.assembly.setCurrentProduct({ id: tableSub })
await api.v1.assembly.instance({ productId: baseTpl, ownerId: tableSub })
await api.v1.assembly.instance({
  productId: pillarTpl, ownerId: tableSub,
  transformation: [[10, 10, 10], [1, 0, 0], [0, 1, 0]],
})

// Return to root and instantiate the sub-assembly
await api.v1.assembly.setCurrentProduct({ id: asmId })
const table1 = (await api.v1.assembly.instance({
  productId: tableSub, ownerId: asmId, name: 'Table1',
})).result
const table2 = (await api.v1.assembly.instance({
  productId: tableSub, ownerId: asmId, name: 'Table2',
  transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result
```

## Related

- `assembly.partTemplate` — create a part template (for geometry inside assemblies)
- `assembly.getAssemblyTemplate` — retrieve by name or get all
- `assembly.deleteTemplate` — remove a template
- `assembly.instance` — instantiate a template
- `assembly.setCurrentProduct` — switch context between assembly levels
- `assembly.convertToTemplate` — convert root assembly into a template
