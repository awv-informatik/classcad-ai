# Skill changes — sprocket session (committed d27553d)

```diff
diff --git a/references/part/boolean.md b/references/part/boolean.md
index 0071423..b2ad2dd 100644
--- a/references/part/boolean.md
+++ b/references/part/boolean.md
@@ -48,6 +48,14 @@ const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', targ
 ## Gotchas
 
 - **Features are consumed.** You cannot reuse target or tool IDs after the boolean. Track the returned feature ID.
+- **`circularPattern`/`linearPattern` targets are already consumed by the pattern.** Tools like
+  `[originalTool, patternOfIt]` fail with 1014 — pass `[patternId]` only (the pattern includes the
+  original instance). The 1014 message **names the wrong entity** (some other tool in the array or
+  the pattern itself, e.g. "SetScrew2"/"Pat"), not the consumed one — verified 2026-08-10. With many
+  tools, check for pattern-target overlaps before trusting the named entity.
+- **Many tools in one call is fine.** A single SUBTRACTION with 7 tools (pattern + revolves +
+  cylinder + extrusions) works — one consumption chain beats sequential booleans for tool-heavy
+  builds (verified 2026-08-10, sprocket generator).
 - **Empty tools is an error**, not a no-op. Error: `"The type \"0\" is not supported in PrepareAPIParams!"` (code 1004).
 - **Multiple `part.create` calls in one session** clear the drawing and can cause confusing `"id" must be provided"` errors. Use one `part.create` per cleared drawing.
 - **No `keepTools` param.** Tools are always consumed. If you need a feature for multiple operations, create separate features for each.
diff --git a/references/part/circularPattern.md b/references/part/circularPattern.md
index 33c3538..e9de63f 100644
--- a/references/part/circularPattern.md
+++ b/references/part/circularPattern.md
@@ -26,6 +26,13 @@ Feature ID (numeric) on success, maxLevel=31 (info). Returns the feature ID even
 
 ## Gotchas
 
+- **The pattern CONSUMES its target features** (verified 2026-08-10, sprocket session). After
+  `circularPattern({ targets: [toolId], count: N })`, the pattern feature owns all N instances
+  *including the original* — `toolId` is no longer independently usable. Consequence for the
+  pattern-then-subtract idiom: `part.boolean` tools must reference **the pattern only** —
+  `tools: [patternId]` cuts all N instances; `tools: [toolId, patternId]` fails with error 1014
+  "already been consumed", and the message **names an arbitrary other tool** (e.g. a later,
+  perfectly valid one), not the offending consumed target — highly misleading when debugging.
 - **`angle=0` does NOT mean equal spacing.** It means literally 0° between copies — all instances stack at the same position. For equal spacing around a full circle, calculate: `angle = 2 * Math.PI / count` (or `'2*C:PI/count'` as expression).
 - **`count` includes the original.** count=4 means 4 total bodies, not 4 copies. count=1 creates the feature but adds no copies.
 - **`merged: 1` fails** with "Boolean operation failed with error 1001" for circularPattern. The feature is created and copies are placed, but the boolean union step fails. Bodies remain separate. Use `part.boolean` with `type: 'UNION'` after creation as a workaround.
diff --git a/references/part/getGeometryIds.md b/references/part/getGeometryIds.md
index 656e90b..72f1a4c 100644
--- a/references/part/getGeometryIds.md
+++ b/references/part/getGeometryIds.md
@@ -66,6 +66,32 @@ Two lookup regimes:
 
 For reliable results, use positions that are exactly on the geometry: edge midpoints, face centers, or vertex coordinates.
 
+### No-match entries are EMPTY ARRAYS, not null
+
+A query entry with no match comes back as `[]` *inside* the result array — e.g. querying
+`arcs`+`circles`+`lines` at one position can return `{ arcs: [6513], circles: [[]], lines: [[]] }`.
+`.filter(Boolean)` keeps the empty arrays (truthy!), and feeding them into
+`getGeometryPositions.elems` silently degrades the whole call (entries with no positions).
+Flatten and keep numeric ids only: `[...arcs, ...circles, ...lines].flat().filter(x => typeof x === 'number')`
+(verified 2026-08-10).
+
+### Revolve rim circles may be unreachable by edge lookup — use the face
+
+On a revolved solid (after boolean), the outer rim circles of a cylindrical band (e.g. a hub OD)
+were NOT found by `arcs` or `circles` at an exact on-edge position, while `lines` happily returned
+a far-away straight edge (looks like a hit, is a red herring — always verify the found id via
+`getGeometryPositions`). Robust alternative: look up the **cylindrical face**
+(`cylinders: [{ positions: [p1, p2] }]`) and read `getGeometryPositions(faceId)` — it returns the
+seam-line + the two rim-circle midpoints, which carry the radius and both end positions
+(verified 2026-08-10, sprocket hub).
+
+### Probe positions can land inside holes
+
+A position mathematically on a surface may sit exactly where a later cut removed it (e.g. both
+hub-surface probes at +Y/+Z azimuths landed inside the two radial set-screw holes → "face not
+found"). When a lookup unexpectedly fails, check what OTHER features intersect the probe point
+before doubting the geometry.
+
 ### IDs change after topology operations
 
 Fillet, chamfer, boolean, and other topology-modifying features change all brep IDs. After any such operation, call `recalc()` then re-query with `getGeometryIds`. Never cache brep IDs across topology changes.
```
