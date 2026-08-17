# Changes — assembly.update3DConstraintValue

## New file: `references/assembly/update3DConstraintValue.md`

```diff
+# assembly.update3DConstraintValue
+
+Sets the current position within a kinematic constraint's degrees of freedom (DOFs). This is the generic API for driving joints — rotating a revolute, translating a slider, etc.
+
+**This API does NOT update structural constraint parameters** (like `fastened.xOffset` or `revolute.zOffset`). It drives the DOF values — the current joint angle, the current slider position. Use the type-specific `update*` APIs (`updateFastened`, `updateRevolute`, etc.) to change structural params.
+
+## Prerequisites
+
+- An assembly with at least one kinematic constraint (revolute, cylindrical, slider, planar, or parallel)
+
+## Key Parameters
+
+- `id` — constraint ID (required). Must be a constraint type, not assembly/instance/template.
+- `name` — which DOF to set. One of: `"X_OFFSET"`, `"Y_OFFSET"`, `"Z_OFFSET"`, `"Z_ROTATION"`. Case-insensitive (`"z_rotation"` works).
+- `value` — number (radians for rotation, mm for offsets) or deg string (`"45deg"`, `"-90deg"`, `"180deg"`). Negative values, zero, and large values are all accepted.
+
+**X_ROTATION and Y_ROTATION are NOT valid names.** The API rejects them with error 1013.
+
+## DOF Mapping (CRITICAL)
+
+| Constraint | DOFs | Working names |
+|---|---|---|
+| revolute | Z rotation | Z_ROTATION |
+| cylindrical | Z translation + Z rotation | Z_OFFSET, Z_ROTATION |
+| slider | Z translation | Z_OFFSET |
+| planar | X/Y translation + Z rotation | X_OFFSET, Y_OFFSET, Z_ROTATION |
+| parallel | X/Y translation + Z rotation | X_OFFSET, Y_OFFSET, Z_ROTATION |
+| fastened | None (rigid) | None — all 4 are silent no-ops |
+| fastenedOrigin | None (rigid) | None — all 4 are silent no-ops |
+| spherical | X/Y rotation | **None** — Z_ROTATION is a no-op, X/Y_ROTATION don't exist |
+
+Key findings:
+- Spherical joints cannot be driven (X/Y_ROTATION not valid names)
+- Rigid constraints (fastened/fastenedOrigin) are silent no-ops
+- Non-DOF names on kinematic constraints are silent no-ops
+- @expr. bindings not supported (only numbers + deg strings)
+- No readback API for current DOF value
+- Array form works for batch updates
+- Names are case-insensitive
```
