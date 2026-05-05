# assembly.create

Creates the root assembly node. This is the top-level container for all assembly building — templates, instances, and constraints live under it.

## Prerequisites

- **Empty drawing.** The drawing must not already contain a root entity (part or assembly). Call `common.clear({})` first if needed. The harness auto-clears between runs, so this is only relevant in multi-step workflows.

## Key Parameters

- `name` — (optional) Name for the root assembly. Default: `"AssemblyRoot"`.
- `ident` — (optional) Custom string identifier, stored in the assembly's `IdentToIdMap` child node. Can be used for lookup by external systems.

## Return Value

- **Success:** `result` = numeric ID of the `CC_AssemblyRoot` node (typically 12 in a fresh drawing). `maxLevel` = 31 (info).
- **Failure:** `result` = null, `maxLevel` = 51, error code 1200: "There is already a root assembly or part which must be removed first."

## Gotchas

- **One root entity only.** A drawing can hold either one root assembly OR one root part — never both, never two. Calling `assembly.create` when a part exists (from `part.create`) fails with code 1200. You must `common.clear({})` first.
- **Does NOT clear the drawing.** Unlike the overall workflow where the harness clears between runs, `assembly.create` itself does not wipe existing content. It only fails if content already exists.
- **Auto-sets currentProduct.** After `create`, `currentProduct` is the assembly. You can immediately call `partTemplate` without `setCurrentProduct`. But `partTemplate` then switches context to the new part — you need `setCurrentProduct({ id: asmId })` to return to assembly context after building geometry.
- **calculateMassProperties errors on empty assembly.** An assembly with no instances/geometry throws a NullMem error. Only call it after instantiating geometry.

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

The `structure` envelope also reports: `root: 12, currentProduct: 12, currentInstance: 12`.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result
// asmId = 12

// Immediately create a part template (no setCurrentProduct needed)
const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
// Build geometry inside template...
await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })

// Return to assembly context (required after partTemplate switches context)
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Instantiate
const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
```

## Related

- `assembly.partTemplate` — create a part template to populate with geometry
- `assembly.assemblyTemplate` — create a sub-assembly template
- `assembly.setCurrentProduct` — switch context between assembly and templates
- `assembly.instance` — instantiate templates (accepts both numeric ID and template name string as `productId`)
- `common.clear` — clear drawing before create if content exists
