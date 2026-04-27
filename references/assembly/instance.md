# assembly.instance

Creates instances of products (part or assembly templates) and adds them to a root assembly, assembly instance, or assembly template.

## Prerequisites

- A root assembly (`assembly.create`)
- At least one template (`assembly.partTemplate` or `assembly.assemblyTemplate`)

## Key Parameters

- `productId` (required) — template to instantiate. Accepts numeric ID, template name string, or ident string.
- `ownerId` (required) — where to place it. Must be assembly or instance type. Accepts numeric ID, name string, or ident string.
- `transformation` — position/orientation. Two formats:
  - **3-point:** `[[originX, originY, originZ], [xDirX, xDirY, xDirZ], [yDirX, yDirY, yDirZ]]` — direction vectors are normalized automatically.
  - **4x4 matrix:** standard homogeneous transform. Scaling is silently ignored. Must be right-handed (det > 0).
  - Default: `[[0,0,0],[1,0,0],[0,1,0]]` (origin, identity rotation).
- `name` — instance name. Auto-generated from template name if omitted (first="TemplateName", then "TemplateName0", "TemplateName1"...).
- `ident` — stable string identifier. Use for reliable programmatic reference (names can duplicate, idents are unique). The ident string can then be used anywhere an `id` parameter is accepted.
- `isLocal` — if `true`, transformation is relative to the owner's coordinate system. Default `false` (global coordinates). Critical when adding to sub-assembly instances.

## Return Value

- **Single call:** numeric ID of the created instance
- **Batch call (array param):** array of numeric IDs `[id1, id2, ...]`
- **On error:** `null` (VOID)
- **maxLevel:** 31 on success (info level, not 0)

## Batch Creation

Pass an array of param objects: `instance([{...}, {...}, {...}])`. Returns array of IDs.

**All-or-nothing:** if ANY entry in the batch is invalid, the ENTIRE batch fails (returns null, maxLevel 51). No partial success.

## Gotchas

- **Bidirectional sync:** adding to an assembly instance (expanded tree) propagates to the template AND all sibling instances. Each gets a new child with a unique ID.
- **Left-handed matrices rejected** — error: "The provided matrix is left-handed. This is not yet supported"
- **Scaling in 4x4 ignored** — geometry stays original size regardless of scale factors in the matrix
- **Non-orthogonal matrices auto-corrected** — succeeds with warning (maxLevel 51)
- **Self-referencing blocked** — cannot place an assembly into itself
- **Duplicate names allowed** — but `getInstance` only finds the first match
- **Empty string name works** — instance still created

## Common Errors

| Error | Meaning |
|---|---|
| "productId" must be provided | Missing required param |
| "ownerId" has a wrong id type! ["assembly","instance"] | Passed a part template ID as owner |
| ToId()/TOID() didn't get an existing or valid id | Nonexistent ID |
| An assembly can not be placed into itself | Self-reference attempt |
| The provided matrix is left-handed | Negative determinant matrix |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAsm' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Single instance at origin
const inst1 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Block_A',
})).result

// Instance with offset
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Block_B',
  transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Batch creation
const batch = (await api.v1.assembly.instance([
  { productId: tplId, ownerId: asmId, name: 'C1', transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] },
  { productId: tplId, ownerId: asmId, name: 'C2', transformation: [[60, 50, 0], [1, 0, 0], [0, 1, 0]] },
])).result // → [id1, id2]
```

## Related

- `assembly.getInstance` — look up instances by owner and optional name
- `assembly.deleteInstance` — remove instances by ID
- `assembly.setIdent` — assign stable string identifier post-creation
- `assembly.setCurrentProduct` — switch context to template for editing
- `assembly.fastened` / `assembly.fastenedOrigin` — constrain instance positions
