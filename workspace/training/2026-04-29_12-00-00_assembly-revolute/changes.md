# Changes — assembly.revolute training

## New file: `references/assembly/revolute.md`

```diff
+# assembly.revolute
+
+Creates a revolute (hinge) constraint between two instances, allowing 1 degree of freedom: rotation around the constraint's Z axis. The constraint solver repositions mate2's instance to align the two WCS origins, with free rotation around the aligned Z axis.
+
+## Prerequisites
+
+- A root assembly (`assembly.create`)
+- At least two instances with work coordinate systems in their templates
+- Must be in assembly context (`setCurrentProduct({ id: asmId })`)
+
+## Key Parameters
+
+- `id` (required) — assembly ID where the constraint is created
+- `mate1` / `mate2` (both required) — each has:
+  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
+  - `csys` (required) — work coordinate system ID from the instance's template
+  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the rotation axis
+  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
+- `zOffset` (optional, default 0) — offset along the rotation axis from mate1 to mate2
+- `zRotationLimits` (optional) — `{ min, max }`. **Both required if provided.** Accepts radians or `'Ndeg'` strings. Stored as radians.
+- `name` (optional, default `'Revolute'`)
+
+## Key Findings
+
+- deleteConstraint uses `ids` (plural array), NOT `id`
+- Partial zRotationLimits (min-only) fails with code 1004
+- Multiple revolute constraints on same instance pair allowed
+- reorient values must be strings ('0','90','180','270')
+- All properties updatable via updateRevolute, including removing limits (pass null)
+- Batch creation works (array of params → array of IDs)
+- getRevolute returns first match when names duplicate
```
