# assembly.convertToTemplate

Demotes the current root assembly into an assembly template and creates a new empty root assembly above it. The converted template is placed in AssemblyContainer and is immediately available for instancing.

## Prerequisites

- An assembly must exist (`assembly.create` called first). Without it: error "Assembly building is not initialized!" (maxLevel 51).

## Key Parameters

- `name` (string, optional) — display name for the converted template. Default: `"Subassembly"`.
  - **NOT sanitized.** Unlike `assemblyTemplate`, special characters (spaces, parens, slashes) are kept verbatim in the `name` field. `'My Sub/Asm (v2)'` stays as-is.
  - Duplicate names auto-deduplicate: "Sub", "Sub0", "Sub1", etc.
  - Empty string is allowed.

## Return Value

- `result` — null (VOID). Always.
- `maxLevel` — 31 on success, 51 on error.

## What Happens

1. Old root (CC_AssemblyRoot) → becomes CC_Assembly, moves under AssemblyContainer (id 10)
2. New root (CC_AssemblyRoot) created as child of AllObjects, name "AssemblyRoot"
3. `structure.root`, `structure.currentProduct`, `structure.currentInstance` all point to new root
4. All instances inside the old root are preserved in the converted template
5. Part templates in PartContainer are unchanged
6. Pre-existing assembly templates in AssemblyContainer are unchanged

## Gotchas

- **Name is NOT sanitized.** `assemblyTemplate` sanitizes `(`, `)`, `/`, spaces → underscores. `convertToTemplate` does NOT. Use `getAssemblyTemplate({ name: 'Conv (v1)/sub' })` with the exact unsanitized name.
- **`originalName` is immutable.** The `originalName` member retains the original `assembly.create`-time name, not the `convertToTemplate` name. If root was created as `'MyRoot'` and converted with name `'SubAsm'`, `originalName` stays `'MyRoot'`.
- **New root has no `originalName`.** The newly created CC_AssemblyRoot does not have an `originalName` member.
- **Always resets `currentProduct`.** Even if `currentProduct` was pointing to a part template, conversion switches it to the new root. You don't need to call `setCurrentProduct` after.
- **Always converts the root.** It doesn't matter what `currentProduct` is — it always converts the root assembly.
- **Same error for part context.** Calling with a part (not assembly) in the drawing gives the same "Assembly building is not initialized!" error.

## Common Errors

| Situation | maxLevel | Message |
|---|---|---|
| No assembly exists | 51 | "Assembly building is not initialized!" + internal eval error |
| Part context (not assembly) | 51 | Same as above |

## Chaining Conversions

You can call `convertToTemplate` multiple times to build hierarchy from the bottom up:

```js
const asmId = (await api.v1.assembly.create({})).result
// ... build content in root ...
const r1 = await api.v1.assembly.convertToTemplate({ name: 'Level1' })
const root2 = r1.structure.root
await api.v1.assembly.instance({ productId: asmId, ownerId: root2 })

const r2 = await api.v1.assembly.convertToTemplate({ name: 'Level2' })
const root3 = r2.structure.root
await api.v1.assembly.instance({ productId: root2, ownerId: root3 })
// Now: root3 > Level2 instance > Level1 instance > original content
```

Each conversion allocates a new root (~13 IDs per conversion).

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

// Build content in root
const partTpl = (await api.v1.assembly.partTemplate({ name: 'Gear' })).result
await api.v1.part.cylinder({ id: partTpl, radius: 20, height: 10 })
await api.v1.assembly.setCurrentProduct({ id: asmId })
await api.v1.assembly.instance({ productId: partTpl, ownerId: asmId, name: 'Gear1' })

// Demote root → template
await api.v1.assembly.convertToTemplate({ name: 'Gearbox' })
// asmId (12) is now a CC_Assembly template named "Gearbox"
// currentProduct points to new root

// Instance the converted template
const newRoot = (await api.v1.common.getAppVersion({})).structure.root
await api.v1.assembly.instance({ productId: asmId, ownerId: newRoot, name: 'GearboxInst' })
```

## Post-Conversion Operations

The converted template behaves identically to an `assemblyTemplate`-created template:

- **Instance it:** `assembly.instance({ productId: oldRootId, ownerId: newRoot })`
- **Work inside it:** `assembly.setCurrentProduct({ id: oldRootId })` then add instances
- **Delete it:** `assembly.deleteTemplate({ ids: [oldRootId] })` — cascade-deletes all instances
- **Find it:** `assembly.getAssemblyTemplate({ name: 'SubAsm' })` or list all with `getAssemblyTemplate({})`

## Related

- `assembly.create` — must be called first
- `assembly.assemblyTemplate` — alternative way to create assembly templates (created empty, not from existing root)
- `assembly.instance` — instantiate the converted template
- `assembly.setCurrentProduct` — switch into the converted template to modify it
- `assembly.deleteTemplate` — delete the converted template (cascade-deletes instances)
- `assembly.getAssemblyTemplate` — find converted templates by name
