# Changes — assembly.getWorkGeometry

## New file: `references/assembly/getWorkGeometry.md`

```diff
+# assembly.getWorkGeometry
+
+Looks up a work geometry feature by name on an assembly instance. Returns the template-scoped ID of the matching work plane, axis, coordinate system, or point.
+
+## Prerequisites
+
+- An assembly with at least one instance of a part template
+- The part template must contain work geometry with the target name
+
+## Key Parameters
+
+- **`id`** (required) — instance ID (CC_ProductReference or CC_ProductReferenceET). Also accepts assembly IDs, but assemblies have no work geometry so the lookup always fails.
+- **`name`** (required) — exact name string, **case-sensitive**. `"Top"` works, `"top"` does not.
+
+## Accepted ID Types
+
+| ID type | Accepted? | Has work geometry? |
+|---|---|---|
+| Instance (CC_ProductReference) | Yes | Yes — from linked part template |
+| ET instance (CC_ProductReferenceET) | Yes | Yes — same as above |
+| Assembly root | Yes | **No** — always "Couldn't find" |
+| Assembly template | Yes | **No** — always "Couldn't find" |
+| Part template | **No** — wrong id type error | N/A |
+
+## Gotchas
+
+- Case-sensitive name matching
+- Part template IDs rejected — use part.getWorkGeometry
+- Returns template-scoped IDs (same across all instances of a template)
+- Sub-assembly instances have no work geometry — use ET instance IDs
+- Assembly roots accepted but always "not found"
+
+## Working examples for direct and nested sub-assembly access included.
```
