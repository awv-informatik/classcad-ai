# Changes — Faceting Concepts

## New file: `references/common/faceting-concepts.md`

New conceptual LLM doc covering:
- Geometric meaning of chordHeightTol (chord height = max distance from surface to mesh)
- Geometric meaning of angleTol (max angle between adjacent facet normals)
- Interaction rule: MAX/AND — whichever constraint demands more triangles wins
- Flat vs curved: faceting only affects curved geometry (box = constant 24 verts)
- Curvature type impact: sphere (double) 6-16x more verts than cylinder (single)
- Edge tessellation shares chordHeightTol
- Per-entity vs global faceting (mode 0 vs 1)
- STL export has independent tessellation via stl.facetingTol/angleTol
- Practical recommendations table

## Modified: `references/common/setDatabaseSettings.md`

**Corrected angleTol section.** Previous description said "only very small values (<10°) tighten tessellation" — this was wrong. angleTol is a fully independent constraint; the misleading result was caused by chordHeightTol=0.1 dominating at angleTol≥15°. Replaced with corrected interaction model and comparative data table.

```diff
-## angleTol — Threshold Behavior
-Only very small values (<10°) tighten tessellation beyond what chord tolerance achieves.
+## angleTol — Independent Constraint
+angleTol is a **fully independent constraint** — not just a chord modifier.
+When both are set, the tessellation engine satisfies whichever demands more triangles (MAX operation).
```

## Modified: `references/common/getDatabaseSettings.md`

Updated `facetingParamsMode`, `chordHeightTol`, and `angleTol` field descriptions in the Key Fields table:
- Removed misleading "no mesh in responses" claim for mode=1
- Added "(model units)" and "(degrees)" units
- Added cross-references to `faceting-concepts.md`
