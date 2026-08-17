# assembly.setCurrentProduct

Sets the "current product" — the active template context for `part.*` operations. Returns the **previous** product ID, enabling rollback.

## Prerequisites

- An assembly created with `assembly.create`, OR a standalone part from `part.create`

## Key Parameters

- `id` — product or instance ID. Accepted types: `["part/assembly","instance"]`. Numeric only — string identifiers are **not supported**.

## Return Value

The **ID of the product that was current before** the switch. This is the key difference from `setCurrentInstance` (which returns VOID). Use it for save/restore patterns.

On error: `null` with maxLevel=51.

## Instance ID Resolution

Passing an instance ID resolves to the instance's **linked template** — not the instance itself. When you later switch away, the "previous product" returned is the template ID, not the instance ID. This means `setCurrentProduct(instId)` is equivalent to `setCurrentProduct(templateId)` for product-switching purposes, but it does **not** set the current instance (only `setCurrentInstance` does that).

## Accepted ID Types

| ID type | Works? | Notes |
|---|---|---|
| Root assembly | Yes | |
| Part template | Yes | |
| Assembly template | Yes | |
| Instance (CC_ProductReference) | Yes | Resolves to instance's template |
| Feature ID | No | Error 1001: wrong id type |
| Invalid numeric ID | No | Error 1006: invalid id |
| String identifier | No | Can't convert string to id |

## Shared State with setCurrentInstance

`setCurrentProduct` and `setCurrentInstance` share the `currentProduct` pointer:

- `setCurrentInstance(instId)` sets currentProduct to the instance's template
- `setCurrentProduct(asmId)` after that returns the template ID as "previous"
- `setCurrentProduct` does NOT set the current instance — only `setCurrentProduct` changes the product pointer

## vs setCurrentInstance

| | setCurrentProduct | setCurrentInstance |
|---|---|---|
| Returns | Previous product ID | VOID |
| Sets current product? | Yes | Yes (to template) |
| Sets current instance? | No | Yes |
| Instance ID behavior | Resolves to template | Navigates to instance |
| Rollback info? | Yes (return value) | No |

Use `setCurrentProduct` when you need rollback info or direct product control. Use `setCurrentInstance` when navigating instance-by-instance.

## Gotchas

- **Idempotent.** Calling with the already-current product returns that product's own ID. No error.
- **No-assembly context.** Works on standalone parts from `part.create` (no assembly needed). Returns the part's own ID.
- **String idents never work.** Even after `setIdent`, the `id` param only accepts numeric IDs.
- **Affects save.** The docs say "the current product is exported in the save commando" — this controls which product is active in saved files.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Save previous product for rollback
const prev = (await api.v1.assembly.setCurrentProduct({ id: tplId })).result
// prev === asmId — can restore later

// Edit the template
const boxFeat = 70
await api.v1.part.openFeature({ id: boxFeat })
await api.v1.part.updateBox({ id: boxFeat, height: 50 })
await api.v1.part.closeFeature({ id: boxFeat })
await api.v1.common.recalc({})

// Restore previous context
await api.v1.assembly.setCurrentProduct({ id: prev })
```

## Related

- `assembly.setCurrentInstance` — instance navigation with automatic product setting
- `assembly.instance` — create instances
- `part.openFeature` / `part.closeFeature` — required for template editing after context switch
