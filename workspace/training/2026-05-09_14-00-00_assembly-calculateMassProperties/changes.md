# Changes — assembly.calculateMassProperties

## New file: `references/assembly/calculateMassProperties.md`

```diff
+# assembly.calculateMassProperties
+
+Calculates center of gravity (COG) and volume for an assembly, instance, part template, or individual solid. Aggregates across all instances in the assembly tree using volume-weighted averaging.
+
+## Namespace Note
+
+`assembly.calculateMassProperties` and `part.calculateMassProperties` are **identical** — same function exposed in two namespaces. Same inputs produce the same outputs. Use whichever namespace matches your context; there is no behavioral difference.
+
+## Prerequisites
+
+- The target must contain at least one solid body — empty assemblies, empty templates, and instances of empty templates all crash with a NullMem error (no graceful zero-volume return)
+
+## Key Parameters
+
+- **`id`** — the object to measure. Accepted types:
+  - **Assembly root** → sums all instances recursively, COG in assembly coordinates
+  - **Part template** → that template's geometry, COG in part-local coordinates
+  - **Instance** (part or sub-assembly) → that instance's mass properties, COG in assembly coordinates (includes the instance transform)
+  - **Solid ID** (from `solid.box`, `solid.sphere`, etc.) → single solid, COG in part-local coordinates
+
+- **NOT accepted:**
+  - **Assembly template** → error: "Getting model information of assembly templates is not supported yet!"
+  - **Feature IDs** → error code 1001: "wrong id type"
+  - **Work geometry IDs** → error code 1001
+  - **Unexpanded sub-instance IDs** → error: "use objects from expanded tree!"
+
+## Gotchas
+
+- **Assembly templates fail** — use instances instead
+- **Unexpanded sub-instance IDs fail** — pass the parent sub-assembly instance ID
+- **Empty anything crashes** — NullMem, not graceful zero
+- **COG is `{x,y,z}` not `[x,y,z]`**
```
