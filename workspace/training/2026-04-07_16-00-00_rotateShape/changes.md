# changes.md — curve.rotateShape training session

## New file: `references/curve/rotateShape.md`

```diff
+# curve.rotateShape
+
+Rotates all curves in a shape by a given rotation vector. Rotation is applied around the **part origin (0, 0, 0)**, not around the shape's center.
+
+## Prerequisites
+
+- A shape (`curve.shape`) containing at least one curve
+- **Do NOT call `common.recalc` between shape creation/modification and rotateShape** — recalc invalidates shape IDs for this API (same bug as `translateShape`)
+
+## Key Parameters
+
+- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
+- `rotation` (required) — `[rx, ry, rz]` rotation angles in **radians** around X, Y, and Z axes respectively. Positive = counterclockwise (right-hand rule). Negative = clockwise.
+
+## Return Value
+
+Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.
+
+## Behavior
+
+- **In-place mutation.** The shape ID remains valid after rotation. No new shape is created.
+- **Cumulative.** Two 45° rotations = one 90° rotation. Each call adds to the current orientation.
+- **Rotation center is the origin.** Shapes offset from the origin will orbit around (0, 0, 0), not rotate in place.
+- **All curves rotate together.**
+- **Zero vector** `[0, 0, 0]` is a silent noop.
+- **Negative angles** rotate in the opposite direction.
+- **Large angles** and full rotations work fine.
+- **Multi-axis rotation** works in a single call.
+
+## Gotchas
+
+- `common.recalc` invalidates shape IDs (error 1006)
+- Empty shapes cannot be rotated (error 1006)
+- `snapshot()` calls recalc internally — do transforms BEFORE snapshots
+- Rotation is around origin, not shape center
+
+## Common Errors, Working Example, Related APIs included.
```
