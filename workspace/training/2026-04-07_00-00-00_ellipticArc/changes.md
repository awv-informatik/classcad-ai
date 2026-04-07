# Changes — curve.ellipticArc training

## New file: `references/curve/ellipticArc.md`

```diff
+# curve.ellipticArc
+
+Creates one or more elliptic arc curves — partial ellipses defined by center, two radii, and start/end angles in radians.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection (`part.entityInjection`)
+- A shape (`curve.shape`)
+
+## Key Parameters
+
+- `id` — shape ID (not part or EIF ID). Must be a shape container.
+- `centerPos` — `[x, y, z]` center of the elliptic arc. Must be 3-element array.
+- `startAngle` — start angle in radians. **Must be >= 0 and <= 2*PI.**
+- `endAngle` — end angle in radians. **Must be >= 0 and <= 2*PI.**
+- `radius1` — radius along the `xAxis` direction. Must be > 0.
+- `radius2` — radius perpendicular to `xAxis` (in the arc plane). Must be > 0.
+- `xAxis` (optional) — `[x, y, z]` direction vector for `radius1` and angle 0. Default `[1,0,0]`.
+- `normal` (optional) — `[x, y, z]` plane normal. Default `[0,0,1]`. **Must not be parallel to `xAxis`.**
+
+## Key Findings
+
+- Angle behavior matches `arcByCenterRadAngle`: CCW sweep, complement when start > end
+- `startAngle=0, endAngle=2*PI` creates a full closed ellipse
+- Equal radii (r1 == r2) produces a circular arc
+- **CRITICAL: xAxis parallel to normal HANGS the server** (confirmed — more severe than `ellipse` which degenerates silently)
+- Negative angles, angles > 2*PI, and radius <= 0 assumed to hang (based on related API behavior)
+- radius1/radius2 are positional (along/perpendicular to xAxis), not semantic (major/minor)
+- Batch creation via array param works
+- Error handling consistent with other curve APIs (codes 1004, 1001, 0)
```
