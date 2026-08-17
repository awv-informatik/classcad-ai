# Changes — assembly.planar training

## New file: `references/assembly/planar.md`

```diff
+# assembly.planar
+
+Creates a planar constraint between two instances. Allows 3 degrees of freedom: translation along X-axis, translation along Y-axis, and rotation around the Z-axis. The Z-axis translation is fixed via `zOffset`.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+- **Ground at least one instance** with `fastenedOrigin` before applying planar — otherwise the solver repositions BOTH instances
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `zOffset` — fixed translation along Z-axis from mate1 to mate2 (default 0). Same semantics as revolute.
+- `xOffsetLimits` — `{ min, max }` constraining X translation range. Negative values supported. Set `{ min: null, max: null }` to remove.
+- `yOffsetLimits` — `{ min, max }` constraining Y translation range. Same behavior as xOffsetLimits.
+- `zRotationLimits` — `{ min, max }` constraining rotation range in radians. Degree strings accepted: `'-45deg'`, `'180deg'`. Set `{ min: null, max: null }` to remove.
+- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Identical to revolute/fastened.
+- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Only visible when zRotationLimits lock the joint.
+
+## Alignment Semantics (CRITICAL — differs from cylindrical)
+
+**Same as fastened/revolute.** With zero offsets, inst2 is placed at inst1's origin. The csys is required by the API but only serves as an identifier — it does not define a mounting point.
+
+**All free DOFs default to 0.** Unlike cylindrical (which preserves the initial Z-offset), planar does NOT preserve initial X/Y position or rotation. The solver resets all free DOFs to 0 regardless of the instance's `transformation`. If limits constrain the range, the default(0) is clamped to the nearest valid value (min if 0 < min, max if 0 > max).
+
+[... full file: 152 lines, see references/assembly/planar.md ...]
```
