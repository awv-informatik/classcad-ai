# Changes — common.transformObjectWithMatrix

## New file: `references/common/transformObjectWithMatrix.md`

```diff
+# common.transformObjectWithMatrix
+
+Transforms an object by applying a 4×4 transformation matrix. Unlike `setObjectCoordSystem` (which sets an absolute coordinate frame), this is **cumulative** — each call composes with the current state.
+
+## Prerequisites
+
+- Any valid object ID (solid, entity injection, part, part feature, work plane, work axis, work point, sketch, curve shape)
+
+## Key Parameters
+
+- `id` — ID of any object to transform.
+- `matrix` — 4×4 array of arrays. Standard homogeneous transform: upper-left 3×3 is rotation/scale, right column is translation, bottom row must be `[0, 0, 0, 1]`.
+- `isGlobal` — (optional, default `TRUE`) Docs say: TRUE if matrix is in global coords, FALSE for local. **In practice, has no observable effect on standalone objects** — tested with explicit OCS rotation, both TRUE and FALSE produce identical results. Likely only meaningful for assembly instances.
+
+## Return Value
+
+`VOID` (null). Success indicated by `maxLevel <= 31`.
+
+## Critical Behavior
+
+- **Cumulative, not absolute.** Each call applies on top of the current state. Two translations of [50,0,0] move to [100,0,0]. To "undo" a transform, apply the inverse matrix. This is the key distinction from `setObjectCoordSystem` (which is absolute/idempotent).
+- **Supports scaling.** Both uniform and non-uniform diagonal scaling work without error.
+- **Identity matrix is a no-op.**
+- **Container scope.** When applied to a container (EIF, part), ALL child objects transform together.
+
+## Matrix Requirements
+
+1. **Right-handed** (positive determinant) — mirror/reflection rejected (code 1014).
+2. **Orthogonal columns** — shear auto-corrected with error.
+3. Bottom row must be `[0, 0, 0, 1]`.
+
+## Gotchas
+
+- Shear matrices silently corrected
+- No mirror/reflection
+- isGlobal has no effect on standalone objects
+
+## Common Errors table, Working Example, Object Type Compatibility, Comparison table with setObjectCoordSystem, Related APIs
```
