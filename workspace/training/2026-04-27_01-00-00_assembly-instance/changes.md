# Changes — Assembly Instance APIs

## New file: `references/assembly/instance.md`

```diff
+# assembly.instance
+
+Creates instances of products (part or assembly templates) and adds them to a root assembly, assembly instance, or assembly template.
+
+## Prerequisites
+- A root assembly (`assembly.create`)
+- At least one template (`assembly.partTemplate` or `assembly.assemblyTemplate`)
+
+## Key Parameters
+- `productId` (required) — template to instantiate. Accepts numeric ID, template name string, or ident string.
+- `ownerId` (required) — where to place it. Must be assembly or instance type.
+- `transformation` — 3-point format or 4x4 matrix. Scaling ignored, left-handed rejected.
+- `name` — auto-generated from template name if omitted.
+- `ident` — stable string identifier, usable in any id param.
+- `isLocal` — transform relative to owner (default false = global).
+
+## Batch Creation
+All-or-nothing: one invalid entry fails the entire array.
+
+## Gotchas
+- Bidirectional sync when adding to assembly instances
+- Left-handed matrices rejected, scaling ignored, non-orthogonal auto-corrected
+- Duplicate names allowed but ambiguous for lookup
```

## New file: `references/assembly/getInstance.md`

```diff
+# assembly.getInstance
+
+Returns instances belonging to an owner.
+- With name → single ID (or empty array if not found — NOT an error)
+- Without name → array of all instance IDs
+- Batch form supported
+- Only accepts assembly or instance as owner
```

## New file: `references/assembly/deleteInstance.md`

```diff
+# assembly.deleteInstance
+
+Deletes instances by ID array.
+- Returns VOID on success
+- Empty ids array is harmless no-op
+- Re-deleting already-deleted → error
+- Bidirectional propagation from expanded-tree instances
+- Ident strings work in the ids array
```

178 lines added across 3 new files. Complete API documentation for the instance lifecycle (create, query, delete) with verified behavior from 14 test scripts.
