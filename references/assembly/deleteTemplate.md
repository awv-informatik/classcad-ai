# assembly.deleteTemplate

Deletes one or more part or assembly templates from the assembly's template containers.

## Prerequisites

- An assembly must exist (`assembly.create` called first).
- The `ids` array must contain valid part template or assembly template IDs (from `partTemplate` / `assemblyTemplate`).

## Key Parameters

- `ids` (Array) — array of template IDs to delete. Accepts both part and assembly template IDs in the same call.

## Return Value

- `result` — null (VOID) on success.
- `maxLevel` — 31 on success, 51 on error.

## Critical: Cascade Deletion

**Deleting a template CASCADE DELETES all its instances** from the assembly tree. No warning, no confirmation. If a template has 10 instances scattered across the assembly, they all vanish silently.

- All instances in `AssemblyRoot.instances` and `instancesNested` are removed.
- The template is removed from `PartContainer` (for part templates) or `AssemblyContainer` (for assembly templates).
- Deleting an assembly template does NOT delete the part templates it references — part templates live independently in `PartContainer`.

## Atomicity

**The call is atomic.** If any ID in the `ids` array is invalid (nonexistent, wrong type, already deleted), the entire operation fails and NO templates are deleted — even the valid ones in the same array.

## Gotchas

- **Stale `currentProduct`.** If you delete the template that is currently active (`currentProduct`), the pointer becomes stale — it still points to the now-dead ID. Call `setCurrentProduct({ id: asmId })` after deletion.
- **Assembly root ID is a silent no-op.** Passing the assembly root ID (CC_AssemblyRoot) returns maxLevel 31 with no messages, but nothing is deleted. It's type-compatible but not a template.
- **Instance IDs rejected.** Passing instance IDs errors with code 1001: "wrong id type! Provide only following id types: ['part/assembly']".
- **Empty `ids: []` is fine.** No-op, maxLevel 31.
- **Not idempotent.** Deleting an already-deleted template errors (code 1006, invalid id).
- **Name reuse is clean.** After deleting a template, you can create a new one with the same name. It gets a fresh ID.

## Common Errors

| Situation | maxLevel | Code | Message |
|---|---|---|---|
| Nonexistent / already-deleted ID | 51 | 1006 | "An element of parameter 'ids' has an invalid id!" |
| Instance ID (wrong type) | 51 | 1001 | "wrong id type! Provide only following id types: ['part/assembly']" |
| ID 0 | 51 | 1006 | "An element of parameter 'ids' has an invalid id!" |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })
const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
await api.v1.part.cylinder({ id: tpl2, height: 30, diameter: 20 })

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result

// Delete tpl1 — also removes inst
await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
// tpl1 and inst are gone, tpl2 survives

// Batch delete
await api.v1.assembly.deleteTemplate({ ids: [tpl2] })
```

## Related

- `assembly.partTemplate` / `assembly.assemblyTemplate` — create templates
- `assembly.getPartTemplate` / `assembly.getAssemblyTemplate` — find templates
- `assembly.instance` — create instances of templates
- `assembly.deleteInstance` — delete instances without touching the template
- `assembly.convertToTemplate` — convert root assembly to template
