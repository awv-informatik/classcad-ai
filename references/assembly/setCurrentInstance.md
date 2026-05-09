# assembly.setCurrentInstance

Sets the given instance or root assembly as the "current instance." Also sets `currentProduct` to the instance's linked template.

## Prerequisites

- An assembly created with `assembly.create`
- At least one instance created with `assembly.instance`

## Key Parameters

- `id` — instance ID, root assembly ID, or template ID (part/assembly). Numeric only — string identifiers are **not supported**.

## Return Value

VOID (null). maxLevel=31 on success. No previous-value return (unlike `setCurrentProduct` which returns the previous product ID).

## What It Does

1. Sets the internal "current instance" pointer.
2. Sets `currentProduct` to the instance's linked template — this is the main practical effect.
3. After the call, `part.*` APIs operate on the instance's template (openFeature, updateBox, etc.).
4. Affects `common.save` metadata (which product is marked active), but the full assembly is always preserved.

## Accepted ID Types

| ID type | Works? | Sets product to |
|---|---|---|
| Instance (CC_ProductReference) | ✓ | Instance's template |
| Expanded-tree instance (CC_ProductReferenceET) | ✓ | Leaf template |
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
| Accepts instance IDs? | Yes | Yes |
| Accepts template IDs? | Yes | Yes |

`setCurrentInstance` is a convenience — it navigates to an instance's template in one call. `setCurrentProduct` gives rollback info (previous ID) and direct product control.

## Gotchas

- **No getter.** There is no `getCurrentInstance` API — you cannot query the current instance.
- **String idents not supported.** Even if you set an ident with `setIdent`, you cannot use it with `setCurrentInstance`. The `id` param only accepts numeric IDs.
- **Idempotent.** Calling twice with the same instance is safe — no error, no side effects.
- **Sub-assemblies.** Works with expanded-tree instance IDs from nested sub-assemblies. The product is set to the leaf template, not the intermediate sub-assembly.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
const boxFeat = (await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const instId = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'BoxInst',
  transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
})).result

// Navigate to instance's template to modify it
await api.v1.assembly.setCurrentInstance({ id: instId })
await api.v1.part.openFeature({ id: boxFeat })
await api.v1.part.updateBox({ id: boxFeat, height: 50 })
await api.v1.part.closeFeature({ id: boxFeat })
await api.v1.common.recalc({})

// Return to assembly context
await api.v1.assembly.setCurrentInstance({ id: asmId })
```

## Related

- `assembly.setCurrentProduct` — direct product switching with rollback info
- `assembly.instance` — create instances
- `assembly.getInstance` — query instances from an owner
- `part.openFeature` / `part.closeFeature` — required for template editing after context switch
