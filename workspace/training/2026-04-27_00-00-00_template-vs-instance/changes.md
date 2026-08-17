# Changes — Template vs Instance Paradigm

## New file: `references/assembly/generic.md`

```diff
+# Template vs Instance Paradigm
+
+The ClassCAD assembly system uses a template/instance architecture. **Templates** define geometry and features (stored in PartContainer or AssemblyContainer). **Instances** are positioned references to templates (stored in the assembly tree). All instances of a template share the same geometry — there is no per-instance geometry override.
+
+## Core Concepts
+
+### Templates
+- **Part templates** (`CC_Part` in `PartContainer`) — full parametric parts with features, sketches, expressions
+- **Assembly templates** (`CC_Assembly` in `AssemblyContainer`) — containers for sub-instances, constraints, expressions
+- Created via `assembly.partTemplate` / `assembly.assemblyTemplate` / `assembly.convertToTemplate`
+- Templates are the ONLY place geometry lives. All `part.*` feature APIs require a template ID, not an instance ID.
+
+### Instances
+- **`CC_ProductReference`** — an instance node in the assembly tree
+- Each has a `productId` member (type: "id") pointing to its template
+- Instances are leaf nodes (for part instances) or have children (for assembly instances)
+- Created via `assembly.instance({ productId, ownerId })`
+
+### Expanded Tree (Assembly Instances)
+When an assembly template is instanced, its sub-instances are mirrored as **`CC_ProductReferenceET`** nodes under the assembly instance. These form the "expanded tree."
+
+## What's Shared vs Per-Instance
+- Geometry, Appearance → template-level only
+- Position, Name, User data, Mass properties → per-instance
+
+## Bidirectional Sync
+- Add/delete through expanded tree instances → propagates to template + all sibling instances
+- Add/delete through template → propagates to all instances
+
+## Key Gotchas
+- Part APIs reject instance IDs
+- setAppearance does not work per-instance
+- Self-referencing blocked
+- Duplicate instance names allowed (getInstance finds first only)
+- getInstance not-found → empty array, not error
+- Save/load preserves all IDs and references
```

152 lines added. Comprehensive conceptual doc covering the template/instance paradigm with structure tree reference, shared/per-instance table, bidirectional sync rules, gotchas, and working example.
