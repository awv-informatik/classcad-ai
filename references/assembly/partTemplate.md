# assembly.partTemplate

Creates a new part and adds it as a template to the PartContainer. The returned ID is a full `CC_Part` node — use it with all `part.*` APIs to build geometry inside the template. Templates are then instantiated with `assembly.instance`.

## Prerequisites

- `assembly.create` must have been called first. Without it: error "Assembly building is not initialized!" (maxLevel=51).

## Key Parameters

- `name` — (optional) Name of the template. Default: `"Part"`. Subsequent unnamed templates get `"Part0"`, `"Part1"`, etc.

## Return Value

- **Success:** `result` = numeric ID of the `CC_Part` node (stored in `CC_PartContainer`). `maxLevel` = 31.
- **Failure:** `result` = null, `maxLevel` = 51.

## Context Behavior

- **`partTemplate` does NOT switch `currentProduct`.** After calling it, context remains on the assembly root.
- **`part.*` calls with the template ID DO switch `currentProduct`** to the template. This is automatic — the first `part.box({ id: tplId, ... })` flips context.
- **`assembly.*` calls work regardless of `currentProduct`** because they accept explicit IDs (`ownerId`, `id`). You do NOT need `setCurrentProduct` back to the assembly before calling `assembly.instance`.
- **Best practice:** Call `setCurrentProduct({ id: asmId })` after building template geometry, before continuing with assembly operations. This isn't strictly required but keeps the state predictable.

## Gotchas

- **Duplicate names allowed** — creating two templates with the same name succeeds (different IDs). But `getPartTemplate({ name: 'X' })` only returns the first match. Use unique names or track IDs directly.
- **Template updates do NOT propagate to existing instances.** Instances snapshot the template geometry at creation time. Modifying the template (openFeature → updateBox → closeFeature → recalc) updates the template itself but existing instances retain their original geometry. New instances created after the modification get the updated geometry. To apply changes to existing instances: delete and re-create them.
- **No `ident` parameter** — unlike `assembly.create`, `partTemplate` only accepts `name`.

## Structure Tree

Templates live in `CC_PartContainer` (id=8, child of AllObjects):

```
AllObjects (id=1)
├── CC_PartContainer (id=8)
│   ├── CC_Part "Plate" (id=22)    ← your template
│   └── CC_Part "Bolt" (id=68)     ← another template
├── CC_AssemblyContainer (id=10)
└── CC_AssemblyRoot (id=12)
    └── CC_ProductReference (id=113, link=22)  ← instance of "Plate"
```

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAssembly' })).result

// Create template
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result

// Build geometry using part.* APIs (this switches currentProduct to template)
const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 50, width: 30, height: 20 })).result
const wcsId = (await api.v1.part.workCSys({
  id: tplId, name: 'MateCSys',
  origin: [25, 15, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

// Return to assembly context (good practice, not strictly required)
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Instantiate — by ID or by name string
const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({
  productId: 'Bracket', ownerId: asmId,
  transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result
```

## Spatial Facts (verified)

- Template geometry uses part primitive alignment: `part.box` is corner-aligned at origin, `part.cylinder` centered at base, `part.sphere` centered at origin.
- Instance COG = template local COG + instance transform origin. E.g., 50×30×20 box template has COG (25,15,10); instance at transform origin (60,0,0) has COG (85,15,10).

## Related

- `assembly.assemblyTemplate` — create a sub-assembly template (for nested assemblies)
- `assembly.getPartTemplate` — retrieve template by name or get all
- `assembly.deleteTemplate` — remove a template
- `assembly.instance` — instantiate a template (accepts numeric ID or name string as `productId`)
- `assembly.setCurrentProduct` — switch context between assembly and templates
- `assembly.convertToTemplate` — convert current root assembly into a template
