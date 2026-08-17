# Changes — sketchRegion training

## New file: `references/sketch/sketchRegion.md`

```diff
+# sketch.sketchRegion
+
+Creates a sketch region from sketch geometry (curves/points). A region represents a closed profile area within a sketch. Region IDs are used for lookup and structural purposes but **NOT** for extrusion — pass curve IDs directly to `part.extrusion` instead.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+- Sketch geometry (lines, arcs, circles) that ideally forms a closed contour
+
+## Key Parameters
+
+- `id` — sketch ID (required)
+- `geomIds` — array of sketch geometry IDs (required). Accepts `sketch-curve` and `sketch-point` type IDs.
+- `name` — optional name for the region. If omitted, auto-generated: `SketchRegion` (first), then `SketchRegion0`, `SketchRegion1`, etc.
+
+## Return Value
+
+`id` — the ID of the created sketch region. Class in structure tree: `CC_SketchRegion`.
+
+## Gotchas
+
+- **No closure validation.** `sketchRegion` does NOT check that `geomIds` form a closed contour. A single line, disconnected lines, or open geometry all create regions silently (maxLevel=31, no error). These may fail when used downstream.
+- **Empty geomIds is allowed.** Passing `[]` creates an empty region with no geometry (no error).
+- **Do NOT pass region IDs to `part.extrusion`.** Extrusion with a region ID as `references` fails with `"CCObject can not be opened"`. Always pass the raw curve IDs (line, arc, circle IDs) directly.
+- **Default naming quirk.** First region is `SketchRegion` (no number). Second is `SketchRegion0`, third is `SketchRegion1`, etc. The numbering starts at 0 from the second region onward.
+
+## Common Errors
+
+| Error | Code | Meaning |
+|---|---|---|
+| `geomIds has a wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | 1001 | Passed a non-geometry ID (e.g., part ID, sketch ID) |
+| `An element of parameter "geomIds" has an invalid id!` | 1006 | Passed a nonexistent/fake ID |
+
+## Structure Tree
+
+A region appears as `CC_SketchRegion` under `CC_GeometrySet`. Key members:
+
+- `sketch` — ID of the parent sketch
+- `curves` — array of curve IDs (same as the `geomIds` passed at creation)
+- `selected` — array of curve IDs (mirrors `curves`)
+
+## Related APIs
+
+- `sketch.updateSketchRegion` — batch update region geometry (VOID return)
+- `sketch.getSketchRegion` — find region by name within a sketch
+- `part.getSketchRegion` — find region by name within a part
+- `sketch.getGeometry` — works on region IDs, returns geometry grouped by type
+
+## Working Example — included with full create/lookup/extrusion workflow
```
