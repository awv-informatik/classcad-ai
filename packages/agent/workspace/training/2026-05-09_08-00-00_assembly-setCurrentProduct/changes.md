# Changes — assembly.setCurrentProduct

## New file: `references/assembly/setCurrentProduct.md`

```diff
+# assembly.setCurrentProduct
+
+Sets the "current product" — the active template context for `part.*` operations. Returns the **previous** product ID, enabling rollback.
+
+## Prerequisites
+
+- An assembly created with `assembly.create`, OR a standalone part from `part.create`
+
+## Key Parameters
+
+- `id` — product or instance ID. Accepted types: `["part/assembly","instance"]`. Numeric only — string identifiers are **not supported**.
+
+## Return Value
+
+The **ID of the product that was current before** the switch. This is the key difference from `setCurrentInstance` (which returns VOID). Use it for save/restore patterns.
+
+On error: `null` with maxLevel=51.
+
+## Instance ID Resolution
+
+Passing an instance ID resolves to the instance's **linked template** — not the instance itself. When you later switch away, the "previous product" returned is the template ID, not the instance ID.
+
+## Accepted ID Types
+
+| ID type | Works? | Notes |
+|---|---|---|
+| Root assembly | Yes | |
+| Part template | Yes | |
+| Assembly template | Yes | |
+| Instance (CC_ProductReference) | Yes | Resolves to instance's template |
+| Feature ID | No | Error 1001: wrong id type |
+| Invalid numeric ID | No | Error 1006: invalid id |
+| String identifier | No | Can't convert string to id |
+
+## Shared State with setCurrentInstance
+
+Both APIs share the `currentProduct` pointer. `setCurrentProduct` does NOT set the current instance.
+
+## Gotchas
+
+- Idempotent — safe to call with the already-current product
+- Works on standalone parts (no assembly needed)
+- String idents never work
+- Affects save metadata
```
