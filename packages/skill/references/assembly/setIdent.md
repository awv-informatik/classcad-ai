# assembly.setIdent

Sets a custom string identifier on an existing assembly object (instance, template, constraint, …). The ident is a human-readable alias usable in place of the numeric ID in some — not all — assembly APIs.

## Key Parameters

- `id` — numeric ID of the object
- `ident` — string, unique across the whole assembly (all object types share one namespace). `''` clears it; calling again replaces the old ident

`assembly.instance` and `assembly.create` also accept `ident` at creation time.

## Return Value

VOID (null), maxLevel 31.

## Ident vs Name

| Property | Set by | Queried by |
|---|---|---|
| **name** | `common.setObjectName` or creation `name` | `getInstance({ name })` |
| **ident** | `assembly.setIdent` or creation `ident` | No query API (no getIdent) — track it yourself or inspect `IdentToIdMap` in the structure tree |

Both resolve in `id` params of APIs that support string resolution; **ident takes priority over name**. Idents live in `IdentToIdMap`, a child of the assembly root mapping strings to numeric IDs.

## String ID Resolution

APIs accepting `string | real | id` resolve strings in order: 1. numeric conversion (`"105"` → 105), 2. ident lookup, 3. name lookup. Many APIs only do step 1 (stol) and error on non-numeric strings with "couldn't be converted to an id."

| Supports ident/name | Numeric only (stol) |
|---|---|
| `assembly.instance` — `productId`, `ownerId` | `setCurrentProduct` / `setCurrentInstance` — `id` |
| `assembly.transformInstance` — `id` | `calculateMassProperties` — `id` |
| `assembly.transformInstanceTo` — `id` | `fastenedOrigin` — `instance`, `mate1.path` |
| `assembly.deleteInstance` — `ids` | `fastened` — `mate1.path`, `mate2.path` |
| | `deleteConstraint` — `ids` |
| | All constraint APIs — `path` arrays (never resolve idents) |

Note: an instance's ident does not work as `productId` — `productId` must be the template.

## Gotchas

- **Batch form is broken.** Passing an array (despite docs showing `Array<object>`) → "objId not found." Use individual calls.
- **Duplicate idents rejected:** "alpha already exists" (maxLevel 51).

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Ident at creation time
const inst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Inst1', ident: 'box_a',
})).result

// Set/replace after creation
await api.v1.assembly.setIdent({ id: inst, ident: 'my_box' })

// Use the ident where supported
await api.v1.assembly.transformInstance({
  id: 'my_box',
  transformation: [[1, 0, 0, 50], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
})
```

## Related

`assembly.instance` · `assembly.create` · `common.setObjectName` · `assembly.getInstance`
