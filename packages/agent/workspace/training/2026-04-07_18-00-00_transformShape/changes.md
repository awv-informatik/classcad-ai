# Changes — curve.transformShape training

## New file: `references/curve/transformShape.md`

```diff
+# curve.transformShape
+
+Applies a 4x4 transformation matrix to all curves in a shape. Combines translation and rotation in a single call. The matrix is in part coordinates.
+
+## Prerequisites
+
+- A shape (`curve.shape`) containing at least one curve
+- **Do NOT call `common.recalc` or `snapshot()` between shape creation/modification and transformShape** — recalc invalidates shape IDs (same bug as `translateShape`/`rotateShape`)
+
+## Key Parameters
+
+- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
+- `matrix` (required) — 4x4 transformation matrix as `Array<Array<real>>`, row-major.
+
+## Key Findings
+
+- Doc discrepancy: "Scaling part of the 4x4 matrix will be ignored" is FALSE — scaling is applied and corrupts geometry
+- Doc discrepancy: "Matrices must be orthogonal" is NOT ENFORCED — non-orthogonal matrices silently accepted
+- Left-handed (negative determinant) properly rejected with error 1014
+- Same recalc invalidation bug as translateShape/rotateShape
+- Recalc invalidates ALL shape IDs in the drawing, not just the target shape
+- Graphic data in response is incremental/partial — unreliable for verification
```
