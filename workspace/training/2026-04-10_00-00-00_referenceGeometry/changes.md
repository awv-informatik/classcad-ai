# Changes — sketch referenceGeometry training

## New files

- `references/sketch/referenceGeometry.md` — LLM doc for sketch.referenceGeometry
- `references/sketch/changeReferenceGeometry.md` — LLM doc for sketch.changeReferenceGeometry
- `references/sketch/unlinkReferenceGeometry.md` — LLM doc for sketch.unlinkReferenceGeometry
- `references/sketch/setReferences.md` — LLM doc for sketch.setReferences

## Diff

```diff
diff --git a/references/sketch/changeReferenceGeometry.md b/references/sketch/changeReferenceGeometry.md
new file mode 100644
+# sketch.changeReferenceGeometry
+
+Re-links existing "Use" geometry in a sketch to a different brep element. The sketch geometry **moves** to match the new reference's projected position.
+
+## Prerequisites
+
+- A sketch with projected reference geometry (from `sketch.referenceGeometry`)
+- A new brep element ID to relink to (from `part.getGeometryIds`)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID
+- **`geomId`** (required) — ID of the sketch geometry to relink (returned by `referenceGeometry`)
+- **`refId`** (required) — ID of the new brep element (edge or vertex)
+
+## Return Value
+
+Returns VOID (null). maxLevel=31 on success.
+
+## Behavior
+
+- **Geometry moves** to match the new reference.
+- **Works on unreferenced geometry** too (keepReference: FALSE)
+- **Works after `unlinkReferenceGeometry`** — can re-establish a link

diff --git a/references/sketch/referenceGeometry.md b/references/sketch/referenceGeometry.md
new file mode 100644
+# sketch.referenceGeometry
+
+Creates "Use" geometry in a sketch by projecting 3D brep elements onto the sketch plane.
+
+## Critical Requirement
+
+**Sketch MUST have a plane reference** (via planeId in create, or setReferences). Default XY plane fails.
+
+## Key findings
+
+- Return value is **Array<id>**, not VOID (docs are wrong)
+- Accepted types: edge-line, vertex, edge-arc, edge-circle. NOT faces/planes
+- Perpendicular edges project as points
+- keepReference: TRUE = associative updates; FALSE = frozen copy
+- No deduplication — same edge projected twice creates two geometry items
+- openFeature NOT required
+- Brep IDs can shift after creating features — re-fetch before use

diff --git a/references/sketch/setReferences.md b/references/sketch/setReferences.md
new file mode 100644
+# sketch.setReferences
+
+Sets plane, axis, and origin references for a sketch.
+
+## Key findings
+
+- Can retroactively fix sketches for referenceGeometry (add missing planeId)
+- Face vs work plane: face moves geometry to face plane; work plane changes internal reference
+- axisId rotates sketch coordinate system
+- isXAxis controls whether axis is X or Y direction
+- originId shifts sketch origin
+- Accepts both brep geometry and work geometry as references

diff --git a/references/sketch/unlinkReferenceGeometry.md b/references/sketch/unlinkReferenceGeometry.md
new file mode 100644
+# sketch.unlinkReferenceGeometry
+
+Disconnects "Use" geometry from its brep reference. Geometry stays, frozen.
+
+## Key findings
+
+- Idempotent — double-unlink is a no-op
+- Can be reversed with changeReferenceGeometry
+- Requires valid geomId (VOID rejected)
```
