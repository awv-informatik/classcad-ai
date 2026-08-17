# Changes: curve.arcByCenterRadAngle

## New file: `references/curve/arcByCenterRadAngle.md`

```diff
+# curve.arcByCenterRadAngle
+
+Creates one or more arcs defined by center position, radius, and start/end angles (in radians). The arc sweeps **counterclockwise** (relative to `normal`) from `startAngle` to `endAngle`.
+
+## Prerequisites
+- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)
+
+## Key Parameters
+- `id` (required) — shape ID
+- `centerPos` (required) — `[x, y, z]` center
+- `startAngle` (required) — **Must be >= 0**
+- `endAngle` (required) — **Must be >= 0 and <= 2*PI**
+- `radius` (required) — positive only
+- `xAxis` (optional, default `[1,0,0]`) — reference direction for angle 0
+- `normal` (optional, default `[0,0,1]`) — arc plane normal, **must not be parallel to xAxis**
+
+## Critical Findings
+- Negative angles HANG the server (any value, even -0.1)
+- Angles > 2*PI HANG the server
+- Parallel xAxis/normal can HANG the server
+- Sweep is always counterclockwise; reversed angles create complement arc
+- xAxis defines the reference direction for angle 0
+- Full circle: startAngle=0, endAngle=2*PI
+- Batch creation supported (array of objects)
```
