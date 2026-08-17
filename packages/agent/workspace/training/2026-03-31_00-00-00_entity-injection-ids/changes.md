# Changes — Entity Injection ID Hierarchy

## New file: `references/part/id-hierarchy.md`

```diff
+# Entity Injection ID Hierarchy
+
+How the `id` parameter maps across `part.*`, `solid.*`, and `curve.*` APIs. Getting this wrong is the #1 source of error 1001.
+
+## The Chain
+
+Part (part.create → partId)
+├─ part.* features (box, extrusion, sketch, etc.) ← id: partId
+└─ Entity Injection (part.entityInjection → eifId)
+   ├─ solid.* (box, cylinder, subtraction, etc.) ← id: eifId
+   └─ curve.shape (→ shapeId) ← id: eifId
+       └─ curve.* (line, arc, circle, etc.) ← id: shapeId
+
+## Which ID Goes Where — mapping table
+## Wrong ID Type → Error 1001 — common mistakes and error format
+## Cross-EI References — boolean/copy across EI boundaries
+## Two IDs Per Solid — feature-level vs geometry-level
+## Curve IDs — return VOID, not addressable individually
+## part.box vs solid.box — comparison table
+## Coexistence — solids and shapes in same EI
```

## Modified: `references/part/entityInjection.md`

```diff
+## Cross-EI Operations
+
+Boolean and copy operations work across EI boundaries:
+
+- `solid.subtraction({ id: ei1, target: solidInEi1, tools: [solidInEi2] })` — the `id` specifies the owning EI, but `target`/`tools` can reference solids from any EI.
+- `solid.copy({ id: destEI, target: solidFromOtherEI })` — copies into `destEI`, source is unchanged.
+
+Solids and shapes can coexist in the same entity injection.
+
+See `references/part/id-hierarchy.md` for the full ID type mapping across domains.

 ## Related
+- `references/part/id-hierarchy.md` — full ID hierarchy documentation
```
