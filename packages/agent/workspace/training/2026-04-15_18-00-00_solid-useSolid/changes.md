# Changes — solid.useSolid training

## New file: `references/solid/useSolid.md`

```diff
+# solid.useSolid
+
+Creates parametric references to solids from other features, making them available for direct manipulation inside an entity injection. This is NOT a copy — it's a live link. When the source feature updates, the referenced solids update too.
+
+## Prerequisites
+
+- A part (`part.create`)
+- One or more source features containing solids (entity injections, `part.box`, `part.extrusion`, etc.)
+- A destination entity injection (`part.entityInjection`) — must be created AFTER the source features in the feature tree
+
+## Key Parameters
+
+- **`from`** — array of feature IDs to get solids from. Two forms, **cannot be mixed in the same call**:
+  - **Plain IDs:** `[featureId1, featureId2]` — pulls ALL solids from each feature. Consumes all solids.
+  - **Object form:** `[{ id: featureId, indices: [0, 2] }]` — pulls specific solids by 0-based index. Only consumes the specified indices.
+- **`in`** — destination entity injection feature ID. Must be an EI — part IDs are rejected with error 1001.
+
+## Return Value
+
+Returns `id[]` — array of new solid IDs created in the destination EI. One ID per solid pulled.
+
+## Behavior
+
+- Parametric link, not a copy. Source updates propagate after recalc.
+- Consumption is per-solid. Plain ID consumes all; indices consume selectively.
+- Feature tree ordering enforced — source must precede destination.
+- Returned IDs are first-class solid IDs.
+- `consumeNeedsCopy` flag on referenced solids.
+
+## Gotchas
+
+- Cannot mix plain IDs and objects in `from`
+- Part IDs or solid IDs in `from` cause internal server crash
+- Empty `from` rejected; empty source returns `[]` gracefully
+- Consumption error message misleading (says entity, means per-solid)
+
+## Common Errors, Usage Hints, Working Example, Related APIs
+
+(full content in file)
```
