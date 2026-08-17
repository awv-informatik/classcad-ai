# assembly.deleteTemplate

Deletes one or more part or assembly templates from the container. Cascades to all instances of the deleted templates — instances are removed from the assembly tree along with any constraints referencing them.

## Prerequisites

- `assembly.create` must have been called first (an assembly must exist).
- The IDs passed must be valid template IDs (from `partTemplate` or `assemblyTemplate`).

## Key Parameters

- `ids` — **required**, array of template IDs to delete. Even for a single template, wrap it in `[id]`.

## Return Value

- **Success:** `result` = null (VOID), `maxLevel` = 31.
- **Failure:** `result` = null, `maxLevel` = 51, error code 1006: "An element of parameter \"ids\" has an invalid id!"

## Cascade Behavior

- **Instances are deleted.** All instances of the deleted template(s) are removed from the assembly tree. No warning, no error — silent cascade.
- **Constraints are cleaned up.** Constraints (fastened, etc.) that reference deleted instances are removed silently.
- **Inner part templates survive.** When deleting an assembly template, the part templates it references are NOT deleted. They remain in PartContainer and can be reused.

## Atomicity

The `ids` array is validated atomically. If **any** ID in the array is invalid (doesn't exist, already deleted, wrong type), the **entire call fails** and no templates are deleted — even the valid ones in the same array.

## Gotchas

- **CRITICAL: Do NOT pass non-template IDs.** The API does not validate that IDs are actually templates. Passing the assembly root ID succeeds silently (maxLevel=31, no error) but **corrupts the assembly** — `getInstance` and `instance` calls fail afterwards. Only pass IDs returned by `partTemplate` or `assemblyTemplate`.
- **Instance IDs are rejected** — passing an instance ID produces error code 1006 (correctly treated as invalid).
- **Double-delete fails** — deleting an already-deleted template ID produces error code 1006 (same as invalid ID).
- **Empty array is a no-op** — `deleteTemplate({ ids: [] })` succeeds silently (maxLevel=31, does nothing).

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
await api.v1.part.box({ id: tpl1, name: 'Box', length: 40, width: 30, height: 20 })

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
await api.v1.part.box({ id: tpl2, name: 'Box', length: 60, width: 20, height: 50 })

await api.v1.assembly.setCurrentProduct({ id: asmId })

// Instantiate both
const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

// Delete tpl1 — inst1 is automatically removed
await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
// getPartTemplate({}) now returns [tpl2] only
// getInstance({ ownerId: asmId }) now returns [inst2] only

// Delete multiple at once
await api.v1.assembly.deleteTemplate({ ids: [tpl2] })
// Both containers now empty
```

## Related

- `assembly.partTemplate` — create a part template
- `assembly.assemblyTemplate` — create an assembly template
- `assembly.getPartTemplate` — verify templates after deletion
- `assembly.deleteInstance` — delete instances without touching templates
- `assembly.convertToTemplate` — convert root assembly to template
