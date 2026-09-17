# assembly.setCurrentProduct

Sets the "current product" — the active template context for `part.*` operations — and returns the **previous** product ID for rollback. Per the docs, the current product "is exported in the save commando" (controls which product is active in saved files).

Prerequisites: an assembly (`assembly.create`) OR a standalone part (`part.create`; then it returns the part's own ID).

## Key Parameters

- `id` — product or instance ID; accepted types `["part/assembly","instance"]`. **Numeric only** — string identifiers, including idents from `setIdent`, never work.

## Return Value

ID of the product current **before** the switch (with the already-current product: its own ID, no error). Error → `null`, maxLevel 51.

## Accepted ID Types

| ID type | Works? | Notes |
|---|---|---|
| Root assembly / part template / assembly template | Yes | |
| Instance (CC_ProductReference) | Yes | Resolves to the instance's **template** |
| Feature ID | No | Error 1001: wrong id type |
| Invalid numeric ID | No | Error 1006: invalid id |
| String identifier | No | Can't convert string to id |

An instance ID is equivalent to its template ID for product switching: a later switch returns the template ID as "previous". It does **not** set the current instance.

## vs setCurrentInstance

Both share the `currentProduct` pointer: `setCurrentInstance(instId)` sets it to the instance's template, so a following `setCurrentProduct(asmId)` returns that template ID.

| | setCurrentProduct | setCurrentInstance |
|---|---|---|
| Returns | Previous product ID | VOID |
| Sets current product? | Yes | Yes (to template) |
| Sets current instance? | No | Yes |
| Instance ID behavior | Resolves to template | Navigates to instance |

Use `setCurrentProduct` for rollback info or direct product control; `setCurrentInstance` for navigating instance-by-instance.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
const boxFeat = (await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const prev = (await api.v1.assembly.setCurrentProduct({ id: tplId })).result  // prev === asmId

await api.v1.part.openFeature({ id: boxFeat })
await api.v1.part.updateBox({ id: boxFeat, height: 50 })
await api.v1.part.closeFeature({ id: boxFeat })
await api.v1.common.recalc({})

await api.v1.assembly.setCurrentProduct({ id: prev })  // restore
```

## Related

`assembly.setCurrentInstance` · `assembly.instance` · `part.openFeature` / `part.closeFeature`
