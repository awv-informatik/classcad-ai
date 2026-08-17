# Skill changes — 2026-06-10 liquid-mixer-v2 build

Committed in `knowledge/classcad-skill` as `a967207`.

```diff
diff --git a/references/part/cone.md b/references/part/cone.md
index ab534ed..8462505 100644
--- a/references/part/cone.md
+++ b/references/part/cone.md
@@ -83,10 +83,11 @@ When using `@expr.` references, updating the expression + recalc automatically c
 ```js
 const partId = (await api.v1.part.create({ name: 'MyPart' })).result
 
-// Optional: create a WCS for positioning
+// Optional: create a WCS for positioning (params: offset + rotation — NOT origin/xDirection,
+// those are silently ignored; see workCSys.md). Cone follows the csys orientation (axis = csys z).
 const wcsId = (await api.v1.part.workCSys({
   id: partId, name: 'WCS1',
-  origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
+  offset: [50, 0, 0],
 })).result
 
 // Create cone at WCS position
diff --git a/references/part/cylinder.md b/references/part/cylinder.md
index ded105b..7771fc0 100644
--- a/references/part/cylinder.md
+++ b/references/part/cylinder.md
@@ -27,6 +27,8 @@ The cylinder is **base-anchored at the origin** — XY centered (axis on Z), but
 ## Gotchas
 
 - **`references` only accepts `workcsys` IDs.** Passing a work plane, work axis, or work point ID fails with error code 1001: "wrong id type! Provide only following id types: ['workcsys']". The docs say "reference of the work coordinate system" — it means literally a workCSys.
+- **The cylinder follows the workCSys ORIENTATION, not just its origin.** The cylinder axis aligns with the csys z-axis. A csys with `rotation: [0, Math.PI/2, 0]` (z → world +X) produces a cylinder along +X. Verified 2026-06-10: csys `offset [30,40,20]` + `rotation [0, π/2, 0]`, cylinder d=12 h=50 → COG (54.96, 40.01, 20.01), i.e., base at the offset point, axis +X. `offset` is applied in WORLD coordinates (the rotation pivots about the csys origin, it does not rotate the offset).
+- **`workCSys` takes `offset` + `rotation` (Euler radians) — NOT `origin`/`xDirection`/`yDirection`.** Those param names are silently ignored (no error, maxLevel 31), leaving an identity csys at the world origin — the cylinder then lands at the drawing origin and the mistake is invisible until you measure. See `workCSys.md`.
 - **Zero/negative dimensions create degenerate features.** The call returns a feature ID but with maxLevel 51 (ERROR) and code 1122: "Value for [param] must be greater than 0." The feature exists in the tree but has no valid geometry. Always validate dimensions > 0.
 - **Multiple cylinders in one part are fine.** Each creates a separate feature with its own body. The renderer assigns distinct colors per body.
 
@@ -76,13 +78,14 @@ When using `@expr.` references, updating the expression + recalc automatically c
 ```js
 const partId = (await api.v1.part.create({ name: 'MyPart' })).result
 
-// Optional: create a WCS for positioning
+// Optional: create a WCS for positioning (params: offset + rotation — NOT origin/xDirection!)
 const wcsId = (await api.v1.part.workCSys({
   id: partId, name: 'WCS1',
-  origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
+  offset: [50, 0, 0],            // world coords
+  rotation: [0, Math.PI / 2, 0], // Euler radians; csys z → world +X
 })).result
 
-// Create cylinder at WCS position
+// Cylinder base at (50,0,0), axis along world +X (follows csys orientation)
 const cylId = (await api.v1.part.cylinder({
   id: partId, name: 'Cyl1',
   references: [wcsId],
diff --git a/references/part/getGeometryIds.md b/references/part/getGeometryIds.md
index 6ccdc71..656e90b 100644
--- a/references/part/getGeometryIds.md
+++ b/references/part/getGeometryIds.md
@@ -120,6 +120,8 @@ const r = await api.v1.part.getGeometryIds({
 })
 ```
 
+**Circle-center lookup only works when the center lies ON a face.** A solid cylinder's top-circle center sits on the cap face → regime 1 (nearest-on-face) finds it. For HOLE mouths the center floats in the void → regime 2 (<0.05 tolerance) → lookup fails with "no geometry could be found". Verified 2026-06-10 on Ø18.63/Ø10/Ø8.1 hole rims: center probes all failed, rim points at 90° off-seam all succeeded. For holes, always probe a rim point: `[cx, cy + r, z]`. Note the seam direction is the cylinder's LOCAL +x — for a hole drilled along world X via a rotated csys (`rotation [0, π/2, 0]`), the seam maps to world −Z, so a world-+Y rim point is safely off-seam.
+
 ### Curved face lookup (2+ positions required)
 
 ```js
```
