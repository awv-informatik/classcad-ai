# Changes — curve.scaleShape training

## New file: `references/curve/scaleShape.md`

```diff
+# curve.scaleShape
+
+Scales all curves in a shape by a uniform factor. Scaling is centered at the **origin (0, 0, 0)** — not the shape's center.
+
+## Prerequisites
+- A shape (`curve.shape`) containing at least one curve
+- Do NOT call `common.recalc` or `snapshot()` between shape creation/modification and scaleShape
+
+## Key Parameters
+- `id` (required) — shape ID
+- `factor` (required) — scale factor (real)
+
+## Key Findings
+- Scale center is origin (0,0,0) — verified numerically
+- Negative factors work (point reflection through origin) — unique to scaleShape, transformShape rejects these
+- Factor 0 silently accepted (degenerate geometry)
+- Cumulative scaling confirmed
+- Recalc invalidation bug confirmed (same as other shape transforms)
+- All curve types scale correctly (lines, circles, arcs, polylines with fillets)
```

Full file is 104 lines. See `knowledge/classcad-skill/references/curve/scaleShape.md` for complete content.
