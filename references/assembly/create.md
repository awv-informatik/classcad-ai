# assembly.create

Creates a new root assembly. This is the top-level container for multi-part assembly modeling.

## Prerequisites

- **Empty drawing.** Unlike `part.create`, this does NOT clear existing content. If a part or assembly already exists, it fails with error code 1200. Call `common.clear()` first if the drawing has content.

## Key Parameters

- `name` (string, optional) — display name for the root assembly. Default: `"AssemblyRoot"`. Special characters (spaces, parentheses, slashes) are sanitized to underscores in the display name, but preserved verbatim in the `originalName` member.
- `ident` (string, optional) — custom string identifier. Creates an `IdentToIdMap` child node that maps this string to the root assembly ID. Only present when `ident` is provided.

## Return Value

- `result` — numeric ID of the created `CC_AssemblyRoot` node (typically 12 on a fresh drawing). Returns `null` on failure.
- `maxLevel` — 31 (info) on success, 51 (error) on failure.
- `messages` — empty array on success. On failure: `[{ code: 1200, level: 51, message: "There is already a root assembly or part which must be removed first." }]`

## Structure After Create

`assembly.create` builds this structure:

```
AllObjects (1)
├── [4] (internal, hidden)
├── [6] (internal, hidden)
├── PartContainer (8)      — CC_PartContainer, holds part templates
├── AssemblyContainer (10) — CC_AssemblyContainer, holds assembly templates
└── AssemblyRoot (12)      — CC_AssemblyRoot, the root assembly
    ├── ExpressionSet (14)
    ├── ConstraintSet (16)
    ├── GeometrySet (18)
    └── IdentMap (22)*      — only if `ident` was provided
```

`structure.root`, `structure.currentProduct`, and `structure.currentInstance` all point to the root assembly ID.

## Gotchas

- **One root per drawing.** You cannot create two root assemblies. A second `assembly.create` call fails with error 1200.
- **Not interchangeable with `part.create`.** `part.create` clears the drawing and sets up part context. `assembly.create` requires a clean drawing — it will not clear an existing part.
- **`originalName` is immutable.** `common.setObjectName` changes the display name but `originalName` always retains the creation-time value.
- **Name sanitization.** Spaces, parentheses, and slashes become underscores in the display name. The original string is preserved in `originalName`.
- **Empty name is allowed.** Passing `name: ''` creates an assembly with blank name — no error.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result
// asmId → 12

// Typical next steps:
const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
await api.v1.part.box({ id: tplId, length: 60, width: 40, height: 30 })
await api.v1.assembly.setCurrentProduct({ id: asmId })
const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
```

## Related

- `assembly.partTemplate` — create part templates inside the assembly
- `assembly.assemblyTemplate` — create sub-assembly templates
- `assembly.instance` — instantiate templates in the assembly tree
- `assembly.setCurrentProduct` — switch context between assembly and part templates
- `common.clear` — clear drawing before creating an assembly
