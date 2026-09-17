# assembly.setCurrentInstance

Sets the "current instance" and sets `currentProduct` to that instance's linked template — the main practical effect: `part.*` APIs (openFeature, updateBox, …) then operate on the template. Also affects `common.save` metadata (which product is marked active); the full assembly is always saved.

Prerequisites: an assembly with at least one instance.

## Key Parameters

- `id` — instance ID, root assembly ID, or template ID (part/assembly). **Numeric only** — string identifiers, including idents from `setIdent`, are not supported.

## Return Value

VOID (null), maxLevel 31. No previous-value return (unlike `setCurrentProduct`).

## Accepted ID Types

| ID type | Works? | Sets product to |
|---|---|---|
| Instance (CC_ProductReference) | ✓ | Instance's template |
| Expanded-tree instance (CC_ProductReferenceET, nested sub-assemblies) | ✓ | Leaf template, not the intermediate sub-assembly |
| Root assembly | ✓ | Root assembly |
| Part/assembly template | ✓ | That template |
| Feature ID | ✗ | Error: wrong id type |
| String identifier | ✗ | Error: can't convert |
| Invalid numeric ID | ✗ | Error: invalid id |

## vs setCurrentProduct

| | setCurrentInstance | setCurrentProduct |
|---|---|---|
| Return value | VOID | Previous product ID |
| Sets current instance? | Yes | No |
| Sets current product? | Yes (to template) | Yes (directly) |
| Accepts instance / template IDs? | Yes / Yes | Yes / Yes |

Use `setCurrentInstance` to navigate to an instance's template in one call; `setCurrentProduct` for rollback info and direct product control.

## Gotchas

- **No getter** — there is no `getCurrentInstance`.
- **Idempotent** — calling twice with the same instance is safe.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
const boxFeat = (await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })
const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'BoxInst' })).result

// Navigate to the instance's template and modify it
await api.v1.assembly.setCurrentInstance({ id: instId })
await api.v1.part.openFeature({ id: boxFeat })
await api.v1.part.updateBox({ id: boxFeat, height: 50 })
await api.v1.part.closeFeature({ id: boxFeat })
await api.v1.common.recalc({})

await api.v1.assembly.setCurrentInstance({ id: asmId })  // back to assembly
```

## Related

`assembly.setCurrentProduct` · `assembly.instance` · `assembly.getInstance` · `part.openFeature` / `part.closeFeature`
