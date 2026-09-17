# assembly.deleteInstance

Removes instances from the assembly tree. The template and other instances are unaffected — deleting all instances of a template does not delete the template.

## Key Parameters

- `ids` — **required** array of instance IDs. `[]` is accepted as a no-op (maxLevel 31).

## Return Value

Always `null` (VOID), success or failure — check `maxLevel`.

## Gotchas

- **Stale `currentProduct`** — if the deleted instance was `currentProduct`, the pointer may become stale (similar to `assembly/deleteTemplate`).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `ToId() didn't get an existing or valid id` | 0 (warn) | ID doesn't exist (deleted or never created) |
| `"ids" has an invalid id` | 1006 | Invalid (e.g. 999999) or already-deleted ID; maxLevel 51 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'Box', length: 20, width: 20, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I2' })).result
const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I3' })).result

await api.v1.assembly.deleteInstance({ ids: [inst1] })
await api.v1.assembly.deleteInstance({ ids: [inst2, inst3] })

const remaining = (await api.v1.assembly.getInstance({ ownerId: asmId })).result  // only undeleted instances
```

## Related

`assembly.instance` · `assembly.getInstance` · `assembly.deleteTemplate`
