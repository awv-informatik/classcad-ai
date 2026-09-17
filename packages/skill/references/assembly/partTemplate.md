# assembly.partTemplate

Creates a new part and adds it as a template to the PartContainer. The returned ID is a full `CC_Part` node — build geometry in it with any `part.*` API, then instantiate with `assembly.instance`.

## Prerequisites

`assembly.create` first. Without it: "Assembly building is not initialized!" (maxLevel 51).

## Key Parameters

- `name` — optional, default `"Part"`; subsequent unnamed templates get `"Part0"`, `"Part1"`, … No `ident` parameter (unlike `assembly.create`).

## Return Value

ID of the `CC_Part` node (maxLevel 31); failure → null, maxLevel 51.

## Context Behavior

- `partTemplate` does **not** switch `currentProduct` (stays on the assembly root).
- `part.*` calls with the template ID **do** switch `currentProduct` to the template (the first `part.box({ id: tplId })` flips it).
- `assembly.*` calls take explicit IDs and work regardless of `currentProduct`, so `setCurrentProduct({ id: asmId })` before `assembly.instance` is not strictly required — but calling it after building template geometry keeps state predictable.

## Gotchas

- **Duplicate names are renamed:** a second `partTemplate({ name: 'Bracket' })` becomes `"Bracket0"`. An unnamed instance takes the template name (`"Bracket"`), so name lookups like `productId: 'Bracket'` then fail with "name of the object is not unique". Pass template IDs, or give instances their own names.
- **Template updates propagate to unmaterialized instances.** Instances start as live references — modifying a template (openFeature → updateBox → closeFeature → recalc) updates every instance not yet materialized. Calling `calculateMassProperties` directly on an instance ID materializes ALL instances of that template; they then keep their geometry independently. To apply changes to them, delete and re-create. Full rules: `assembly/generic`.
- **Primitive alignment:** `part.box` is corner-aligned at origin, `part.cylinder` centered at base, `part.sphere` centered at origin. Instance COG = template local COG + instance origin (50×30×20 box, COG (25,15,10); instance at (60,0,0) → COG (85,15,10)).

## Structure Tree

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
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result

// part.* calls switch currentProduct to the template
await api.v1.part.box({ id: tplId, name: 'Body', length: 50, width: 30, height: 20 })
await api.v1.part.workCSys({ id: tplId, name: 'MateCSys', offset: [25, 15, 20] })

await api.v1.assembly.setCurrentProduct({ id: asmId })

// Instantiate by name string or by ID (instances get unique names)
const inst1 = (await api.v1.assembly.instance({ productId: 'Bracket', ownerId: asmId, name: 'B1' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'B2',
  transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result
```

## Related

`assembly.assemblyTemplate` · `assembly.getPartTemplate` · `assembly.deleteTemplate` · `assembly.instance` · `assembly.setCurrentProduct` · `assembly.convertToTemplate`
