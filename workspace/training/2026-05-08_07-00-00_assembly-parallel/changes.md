# Changes — assembly.parallel training

## New file: `references/assembly/parallel.md`

```diff
+# assembly.parallel
+
+Creates a parallel constraint between two instances. Allows 4 degrees of freedom: translation along X, Y, and Z axes, plus rotation around the Z-axis. Only constrains orientation — the Z-axes of both mates stay parallel (X-rotation and Y-rotation locked).
+
+## Prerequisites
+- An assembly root, at least two instances with workCSys, ground one with fastenedOrigin
+
+## Key Parameters
+- id, mate1/mate2 (path + csys), xOffsetLimits, yOffsetLimits, zOffsetLimits, zRotationLimits, flip, reorient
+
+## Key Findings
+- 4 DOF free (X/Y/Z translation + Z rotation), 2 constrained (X-rot, Y-rot)
+- Preserves initial position with default flip (like cylindrical, unlike planar)
+- Non-default flip triggers re-solve, resets to origin
+- All three offset limits can be set simultaneously, clamp independently
+- Removing limits preserves last solved position
+- No fixed `zOffset` param (unlike planar/revolute)
+- getParallel returns 4 limit objects (x/y/z offset + zRotation)
+- updateParallel: constraint ID required, true partial update
+- Error patterns match other constraints exactly
```
