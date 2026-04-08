# Training: sketch.deleteSketch

**Date:** 2026-04-08

## Goal

Testing `v1.sketch.deleteSketch` — deletion of sketches by ID array.

**Methods to cover:**

- `deleteSketch` — single ID deletion
- `deleteSketch` — multiple IDs in one call
- `deleteSketch` — empty array behavior
- `deleteSketch` — invalid/already-deleted IDs
- `deleteSketch` — mixed valid + invalid IDs
- `deleteSketch` — sketch with geometry inside
- `deleteSketch` — sketch used as extrusion profile (feature dependency)
- `deleteSketch` — verify structure tree cleanup (all 3 internal objects removed)
- `deleteObject` vs `deleteSketch` — can deleteObject delete a whole sketch?

**Questions:**

- Does deleting a sketch that's used by a feature (extrusion) cascade or error?
- What happens with mixed valid/invalid IDs — partial success or all-or-nothing?
- Can `deleteObject` be used to delete a sketch, or only sketch sub-objects?
- Does the structure tree fully clean up (CC_Sketch, CC_SketchReference, CC_SketchDimensionSet)?
