# assembly.setIdent

Sets a custom string identifier on an existing assembly object. The ident acts as a human-readable alias for the numeric ID and can be used in place of numeric IDs in some (but not all) assembly APIs.

## Prerequisites

- An assembly with objects (instances, templates, constraints, etc.)

## Key Parameters

- `id` — numeric ID of the object to tag
- `ident` — string identifier. Must be globally unique within the assembly. Stored in a centralized `IdentToIdMap` at the assembly root.

## Return Value

VOID (null). maxLevel 31 on success.

## Ident vs Name

Ident and name are independent properties on the same object:

| Property | Set by | Queried by | Resolves in `id` params |
|---|---|---|---|
| **name** | `common.setObjectName` or creation `name` param | `getInstance({ name })` | Yes, in APIs that support string resolution |
| **ident** | `assembly.setIdent` or creation `ident` param | No query API (inspect `IdentToIdMap` in structure tree) | Yes, in APIs that support string resolution |

When both resolve, **ident takes priority over name**.

## String ID Resolution Order

APIs that accept `string | real | id` resolve strings in this order:
1. **Numeric conversion** — `"105"` → number 105
2. **Ident lookup** — check `IdentToIdMap`
3. **Name lookup** — check object names

Not all APIs perform steps 2–3. Many only do step 1 (stol conversion) and error on non-numeric strings with "couldn't be converted to an id."

## Which APIs Accept Ident Strings

**Supports ident/name resolution:**
- `assembly.instance` — `productId`, `ownerId`
- `assembly.transformInstance` — `id`
- `assembly.transformInstanceTo` — `id`
- `assembly.deleteInstance` — `ids` array

**Does NOT support ident (stol only):**
- `assembly.setCurrentProduct` — `id`
- `assembly.setCurrentInstance` — `id`
- `assembly.calculateMassProperties` — `id`
- `assembly.fastenedOrigin` — `instance`, `mate1.path`
- `assembly.fastened` — `mate1.path`, `mate2.path`
- `assembly.deleteConstraint` — `ids` array
- All constraint APIs — `path` arrays

## Gotchas

- **Batch form is broken.** Despite docs showing `param` accepts `Array<object>`, passing an array results in "objId not found." Use individual calls.
- **No getIdent API.** There is no way to query an object's ident. Track idents yourself or inspect the `IdentToIdMap` in the structure tree.
- **Duplicate idents are rejected** with error "alpha already exists" (maxLevel 51).
- **Overwriting works.** Call setIdent again with a new string — the old ident is replaced.
- **Clearing works.** Pass `ident: ''` to remove an ident.
- **Creation-time ident.** Both `assembly.instance` and `assembly.create` accept an optional `ident` param to set the ident at creation time, avoiding a separate setIdent call.
- **Path arrays never resolve idents.** Constraint mate paths (`mate1.path`, `mate2.path`) always require numeric IDs — they do stol conversion only.

## Internal Storage

Idents are stored in a centralized `IdentToIdMap` node (child of the assembly root in the structure tree). Each entry maps a string to a numeric ID. This map is assembly-global — all idents across all object types share the same namespace.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Set ident at creation time
const inst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Inst1', ident: 'box_a'
})).result

// Or set/change ident after creation
await api.v1.assembly.setIdent({ id: inst, ident: 'my_box' })

// Use ident in supported APIs
await api.v1.assembly.transformInstance({
  id: 'my_box',
  transformation: [[1, 0, 0, 50], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
})

// Use ident as ownerId/productId
const inst2 = (await api.v1.assembly.instance({
  productId: 'my_box', // resolves template via ident? No — productId is template ID
  ownerId: asmId, name: 'Inst2'
})).result
```

## Related

- `assembly.instance` — accepts `ident` param at creation
- `assembly.create` — accepts `ident` param at creation
- `common.setObjectName` — sets name (different from ident)
- `assembly.getInstance` — queries by name, NOT by ident
