# assembly.create

Creates the root assembly node — the top-level container for templates, instances, and constraints.

## Prerequisites

**Empty drawing.** A drawing holds one root entity: one assembly OR one part, never both, never two. `assembly.create` does NOT clear the drawing (unlike `part.create`); with existing content it fails with 1200. Call `common.clear({})` first.

## Key Parameters

- `name` — optional, default `"AssemblyRoot"`
- `ident` — optional string identifier, stored in the root's `IdentToIdMap`; usable for lookup by external systems

## Return Value

- Success: ID of the `CC_AssemblyRoot` (typically 12 in a fresh drawing), maxLevel 31
- Failure: null, maxLevel 51, code 1200: "There is already a root assembly or part which must be removed first."

## Gotchas

- **Auto-sets currentProduct** to the assembly; `partTemplate` can follow immediately. Context switching afterwards: see `assembly/partTemplate`.
- **calculateMassProperties errors on an empty assembly** (NullMem). Call it only after instantiating geometry.

## Structure Tree After Create

```
AllObjects (id=1)
├── ... (system nodes 4, 6)
├── CC_PartContainer (id=8, empty)
├── CC_AssemblyContainer (id=10, empty)
└── CC_AssemblyRoot (id=12, name="YourName")
    ├── CC_ExpressionSet (id=14)
    ├── CC_ConstraintSet (id=16)
    ├── CC_GeometrySet (id=18)
    │   └── CC_WorkCSys "BaseWCSys" (id=20)
    └── IdentToIdMap (id=22)
```

The `structure` envelope reports `root: 12, currentProduct: 12, currentInstance: 12`.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result  // 12
const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })
await api.v1.assembly.setCurrentProduct({ id: asmId })  // good practice after part.* calls
const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
```

## Related

`assembly.partTemplate` · `assembly.assemblyTemplate` · `assembly.setCurrentProduct` · `assembly.instance` · `common.clear`
