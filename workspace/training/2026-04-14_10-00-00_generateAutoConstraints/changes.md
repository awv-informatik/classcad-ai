# Changes: sketch.generateAutoConstraints

## File modified

`references/sketch/generateAutoConstraints.md` — major rewrite based on live testing.

## Diff

```diff
-Automatically generates geometric constraints for a single sketch geometry element. Detects fixation at origin, horizontal/vertical alignment, coincidence with existing geometry, and tangency between curves.
+Detects and creates geometric constraints based on spatial relationships between sketch elements. Primarily useful when geometry was created in an order where creation-time auto-detection missed relationships.

 ## Prerequisites
-- A sketch (`sketch.create`)
+- A sketch with `planeId` set (`sketch.create`)

 ## Key Parameters
-- **`genTangency`** (optional, default true) — generate tangency constraints between curves (e.g., arc tangent to a line).
+- **`genTangency`** (optional, default `true`) — generate tangency constraints. Not observed to produce tangent constraints in testing.

+## When Is It Useful?
+Geometry creation APIs already run auto-constraint detection at creation time. Calling generateAutoConstraints afterward is usually a no-op. The API adds value when creation order prevents auto-detection.

+## Idempotent / No Duplicates
+Safe to call multiple times — never adds duplicate constraints.

+## Accepted Geometry Types
+Table added: Line, Point, Circle, Arc all accepted. Sketch ID rejected.

 ## Gotchas
-- **Boolean flags must be JS `false`/`true`.** (removed — not verified, may have been wrong)
-- **Only exact alignment detected.** (kept in spirit via explanation)
+- **Tangency not detected.** (new finding)
+- **Most calls are no-ops.** (new finding — key insight)
+- **VOID error from null IDs.** (new finding)

-- Working example used `genFixation: false` on sketch.line (not verified that line accepts these flags)
+- Working example now shows the actual tested use case: point-before-line coincidence detection
+- Added Flag Control section with tested examples
```

## Summary

Rewrote the LLM doc based on 18 test scripts. Key corrections:
1. Previous doc claimed tangency detection works — not observed in testing
2. Previous doc suggested line creation accepts genFixation/genVertAndHoriz flags — not verified
3. Added the critical insight: autoGen is primarily useful when creation ORDER causes missed auto-detection
4. Added tested working example and flag control examples
