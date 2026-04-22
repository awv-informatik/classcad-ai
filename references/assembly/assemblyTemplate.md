# assembly.assemblyTemplate

Creates a new assembly template (sub-assembly) in the AssemblyContainer. Used for building hierarchical multi-part structures — a sub-assembly groups part instances that move together.

## Prerequisites

- An assembly must exist (`assembly.create` called first). Without it: `result: null`, error "Assembly building is not initialized!"

## Key Parameters

- `name` (string, optional) — display name. Default: `"Assembly"`.
  - Multiple unnamed calls auto-increment: "Assembly", "Assembly0", "Assembly1", ...
  - Duplicate names are auto-deduplicated: "Motor", "Motor0", "Motor1", ... — no error.
  - Empty string is allowed (creates a template with blank name).
  - Special characters (spaces, parens, slashes) are sanitized to underscores in display name, preserved in `originalName`.

## Return Value

- `result` — numeric ID of the new `CC_Assembly` node. Returns `null` on failure.
- `maxLevel` — 31 (info) on success.

## Context Switching (Critical)

**`assemblyTemplate()` does NOT switch `currentProduct`.** After calling it, `structure.currentProduct` still points to whatever was current before (usually the assembly root).

To work inside the assembly template (add instances to it), you must call:
```js
await api.v1.assembly.setCurrentProduct({ id: subAsmId })
```

Then use `assembly.instance({ productId: partTplId, ownerId: subAsmId })` to add parts.

**Switch back** to the root assembly before creating root-level instances:
```js
await api.v1.assembly.setCurrentProduct({ id: asmId })
```

## Structure

```
AssemblyContainer (10)
└── CC_Assembly (22)           ← your assembly template
    ├── ExpressionSet
    ├── ConstraintSet
    ├── GeometrySet
    └── [instances you add]
```

All assembly templates live flat under AssemblyContainer — nesting is achieved by instancing one assembly template inside another, not by container hierarchy.

## ID Spacing

Each assembly template consumes ~10 IDs for internal nodes (vs ~46 for part templates). First template typically starts at 22 (if no part templates created before it).

## Gotchas

- **`partTemplate()` always creates in PartContainer**, regardless of whether `currentProduct` points to an assembly template. Part templates are global, not scoped to a sub-assembly.
- **Has `originalName` member** (unlike `partTemplate`). Sanitized name goes to `name`, raw string to `originalName`.
- **`getAssemblyTemplate({ name: '' })` fails** even if an empty-named template exists — returns error, not the template.
- **No `ident` param.** Unlike `assembly.create`, `assemblyTemplate` has no `ident` parameter.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

// Create part templates
const gearTpl = (await api.v1.assembly.partTemplate({ name: 'Gear' })).result
await api.v1.part.cylinder({ id: gearTpl, radius: 20, height: 10 })

const shaftTpl = (await api.v1.assembly.partTemplate({ name: 'Shaft' })).result
await api.v1.part.cylinder({ id: shaftTpl, radius: 5, height: 60 })

// Create sub-assembly template
const gearboxTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Gearbox' })).result

// Switch into sub-assembly to populate it
await api.v1.assembly.setCurrentProduct({ id: gearboxTpl })
await api.v1.assembly.instance({ productId: shaftTpl, ownerId: gearboxTpl, name: 'MainShaft' })
await api.v1.assembly.instance({
  productId: gearTpl, ownerId: gearboxTpl, name: 'Gear1',
  transformation: [[0, 0, 10], [1, 0, 0], [0, 1, 0]],
})

// Switch back and instance the sub-assembly
await api.v1.assembly.setCurrentProduct({ id: asmId })
await api.v1.assembly.instance({ productId: gearboxTpl, ownerId: asmId, name: 'Gearbox_1' })
```

## Nested Sub-Assemblies

Assembly templates can be instanced inside other assembly templates for deep hierarchies:

```js
const subA = (await api.v1.assembly.assemblyTemplate({ name: 'SubA' })).result
const subB = (await api.v1.assembly.assemblyTemplate({ name: 'SubB' })).result

// Add parts to subB, then instance subB inside subA
await api.v1.assembly.setCurrentProduct({ id: subA })
await api.v1.assembly.instance({ productId: subB, ownerId: subA, name: 'SubBInst' })
```

## convertToTemplate

`assembly.convertToTemplate({ name })` demotes the current root assembly into an assembly template and creates a new empty root:
- Old root → `CC_Assembly` in AssemblyContainer (with given name, default "Subassembly")
- New root → `CC_AssemblyRoot` (name "AssemblyRoot")
- `currentProduct` and `root` point to the new root
- Part templates unchanged
- Returns VOID

## Related

- `assembly.create` — must be called first to initialize assembly building
- `assembly.getAssemblyTemplate` — find by name (single ID) or list all (no params → array)
- `assembly.deleteTemplate` — delete templates by `ids` array (works on both part and assembly templates)
- `assembly.convertToTemplate` — demote root assembly to assembly template
- `assembly.partTemplate` — create part templates (stored in PartContainer, not AssemblyContainer)
- `assembly.setCurrentProduct` — switch context between root and templates
- `assembly.instance` — instantiate templates in the assembly tree
