# Changes — sketch.point training

## New file: `references/sketch/point.md`

```diff
+# sketch.point
+
+Creates one or multiple construction points in a sketch. Returns the point ID(s).
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID (not part ID). Error code 1001 if you pass the wrong type.
+- **`pos`** (required) — `[x, y, z]` in **sketch-local coordinates**. Z must be exactly 0 — non-zero Z is a hard error (code 1014), not a silent projection.
+- **`genFixation`** (optional, default TRUE) — auto-generates a `CC_2DFixationConstraint` ("Auto_Fix") **only when the point is placed at the origin** (0,0,0). Has no effect for off-origin points.
+- **`genIncidence`** (optional, default TRUE) — auto-generates a `CC_2DCoincidentConstraint` ("Auto_Coinc") when the new point's position **exactly matches** an existing point's position. No tolerance. Works cross-geometry.
+
+## Key Findings
+
+- Z=0 strictly enforced (error 1014)
+- genFixation only affects origin points
+- genIncidence exact-match only, no tolerance
+- pos input is sketch-local, getPositions returns world coords
+- Batch creation returns array of IDs
+- Auto-naming: "Point", "Point0", "Point1", ...
+- Each point consumes 2 IDs; auto-constraints add more
+- Cross-geometry coincidence detected (point↔line endpoint)
```
