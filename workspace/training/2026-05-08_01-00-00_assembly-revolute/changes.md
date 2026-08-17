# Changes — assembly.revolute training

## New file: `references/assembly/revolute.md`

```diff
+# assembly.revolute
+
+Creates a revolute (hinge) constraint between two instances. Allows 1 degree of freedom: rotation around the shared Z-axis.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+- **Ground at least one instance** with `fastenedOrigin` before applying revolute — otherwise the solver repositions BOTH instances
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `zOffset` — translation along the revolute Z-axis from mate1 to mate2 (default 0)
+- `zRotationLimits` — `{ min, max }` defining the angular range in radians. Also accepts degree strings: `'-45deg'`, `'180deg'`. Stored internally as radians. Set `{ min: null, max: null }` to remove limits.
+- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2's orientation before constraint solving.
+- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Defines the zero-angle reference for the revolute joint.
+
+## Alignment Semantics (CRITICAL)
+
+**Same as fastened.** With zero offsets, inst2 is placed at inst1's origin regardless of csys positions.
+
+(+ 130 more lines covering DOF behavior, zOffset, zRotationLimits, flip/reorient tables, getRevolute, updateRevolute, gotchas, working example, and related APIs)
```
