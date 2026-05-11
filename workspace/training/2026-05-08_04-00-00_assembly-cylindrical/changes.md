# Changes — assembly.cylindrical

## New file: `references/assembly/cylindrical.md`

```diff
+# assembly.cylindrical
+
+Creates a cylindrical constraint between two instances. Allows 2 degrees of freedom: rotation around the shared Z-axis AND translation along the Z-axis.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+- **Ground at least one instance** with `fastenedOrigin` before applying cylindrical — otherwise the solver repositions BOTH instances
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `zOffsetLimits` — `{ min, max }` constraining Z-translation range. Partial limits work: `{ min: 10 }` sets min only. Set `{ min: null, max: null }` to remove. Negative values supported.
+- `zRotationLimits` — `{ min, max }` constraining rotation range in radians. Degree strings accepted: `'-45deg'`, `'90deg'` (converted to radians on storage). Set `{ min: null, max: null }` to remove.
+- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Identical to revolute/fastened.
+- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Only visible when zRotationLimits lock the joint.
+
+## Alignment Semantics (CRITICAL — differs from revolute)
+
+**X,Y alignment is the same as fastened/revolute.** With default flip, inst2's X,Y position snaps to inst1's origin.
+
+**Z is a FREE DOF.** Unlike revolute (which has a fixed `zOffset` param), cylindrical preserves the initial Z-offset from the instance's transformation. The solver does not move inst2 along Z unless `zOffsetLimits` force clamping.
+
+**No `zOffset` parameter.** Passing `zOffset` is silently ignored — no error, no effect. Use `zOffsetLimits: { min: N, max: N }` to lock inst2 at a specific Z-offset.
+
+(full file: 181 lines covering DOF, zOffsetLimits clamping, zRotationLimits, flip, reorient, getCylindrical, updateCylindrical, gotchas, working example)
```
