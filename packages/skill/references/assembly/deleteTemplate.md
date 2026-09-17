# assembly.deleteTemplate

Deletes part or assembly templates. Cascades silently: all instances of the deleted templates, and constraints referencing them, are removed.

Prerequisites: an assembly (`assembly.create`); template IDs from `partTemplate` / `assemblyTemplate`.

## Key Parameters

- `ids` — **required** array of template IDs (wrap a single ID: `[id]`). `[]` is a silent no-op (maxLevel 31)

## Return Value

VOID (null), maxLevel 31. Failure: maxLevel 51, code 1006: "An element of parameter \"ids\" has an invalid id!"

## Behavior

- **Atomic.** If any ID is invalid (nonexistent, already deleted, wrong type), the whole call fails and nothing is deleted.
- **Inner part templates survive** deleting an assembly template; they stay in PartContainer for reuse.
- Instance IDs and double-deletes → 1006.

## Gotchas

- **CRITICAL: pass only template IDs.** IDs are not checked to be templates: passing the assembly root ID succeeds silently (maxLevel 31) but **corrupts the assembly** — `getInstance` and `instance` fail afterwards.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
await api.v1.part.box({ id: tpl1, name: 'Box', length: 40, width: 30, height: 20 })
const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
await api.v1.part.box({ id: tpl2, name: 'Box', length: 60, width: 20, height: 50 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
// getPartTemplate({}) → [tpl2]; getInstance({ ownerId: asmId }) → [inst2] (inst1 removed)
```

## Related

`assembly.partTemplate` · `assembly.assemblyTemplate` · `assembly.getPartTemplate` · `assembly.deleteInstance` · `assembly.convertToTemplate`
