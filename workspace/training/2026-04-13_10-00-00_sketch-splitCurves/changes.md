# Changes — sketch.splitCurves training

## New file: `references/sketch/splitCurves.md`

```diff
+# sketch.splitCurves
+
+Splits curves at specific parameterized positions. Unlike `splitAllCurves` (which splits at intersection points and stages the result), `splitCurves` is an **immediate, permanent operation** — the original curve is destroyed and replaced by segments right away.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- At least one curve (line, arc, circle) in the sketch
+
+## Key Parameters
+
+- `id` — sketch ID (required). Must be a sketch, not a part.
+- `splits` — array of split specifications, each with:
+  - `geomId` — curve ID to split. Must be a `sketch-curve` type (lines, arcs, circles). Points are rejected.
+  - `values` — array of parameter positions in `[0, 1]` range. Position 0 = curve start, 1 = curve end. For circles, maps to `[0, 2*PI]`.
+
+## Return Value
+
+`Array<Array<id>>` — one inner array per `splits` entry.
+
+- **Open curves** (lines, arcs): N split values → **N+1 segments**
+- **Closed curves** (circles): N split values → **N segments** (not N+1 — the docs are wrong about this)
+- **Circles with 1 split value** → returns **VOID** (cannot split a circle with a single cut)
+- **Empty `splits` array** → returns `[]`
+- **Empty `values` array** → returns `[[originalId]]` (original curve ID, no actual split)
+
+## Naming Convention
+
+Segments are named `Split_{OriginalName}`, `Split_{OriginalName}0`, `Split_{OriginalName}1`, etc.
+A `Split_Coinc` (CC_2DCoincidentConstraint) is auto-created at each split point.
+
+## Critical Differences from splitAllCurves
+
+- splitCurves is immediate; splitAllCurves is staged
+- trimCurves does NOT work on splitCurves results (silent no-op)
+- Different naming: Split_{Name} vs {Name}_partN
+
+## Key Gotchas
+
+- Out-of-range values silently extrapolate geometry
+- Boundary values (0.0, 1.0) create degenerate zero-length segments
+- splitCurvesMergeBack is a no-op after splitCurves
+- Circles need ≥2 split values
```
