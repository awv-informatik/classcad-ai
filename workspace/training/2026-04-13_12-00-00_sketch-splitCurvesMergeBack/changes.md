# Skill Changes — sketch.splitCurvesMergeBack

## New file: `references/sketch/splitCurvesMergeBack.md`

```diff
+# sketch.splitCurvesMergeBack
+
+Commits staged split results from `splitAllCurves` into real sketch geometry. This is **step 3** of the trim workflow: `splitAllCurves → trimCurves → splitCurvesMergeBack`.
+
+Without mergeBack, trims are invisible — the original curves stay rendered until this call applies the changes.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- `splitAllCurves` must have been called first (otherwise mergeBack is a no-op)
+
+## Key Parameters
+
+- `id` — sketch ID (required). Must be a sketch ID, not a part ID.
+
+That's it — no other parameters. No options, no configuration.
+
+## Return Value
+
+Always VOID (null). maxLevel=31 on success. No useful return data.
+
+## What mergeBack Does
+
+### With trimmed segments
+Curves that had segments removed by `trimCurves`:
+- Original curve is destroyed
+- Remaining segments become new curves with **new IDs**
+- Circles become arcs if a segment was removed
+- Two remaining segments of a line become two separate line entities
+
+### Without trimmed segments
+Curves that were split but had NO segments trimmed:
+- **Reconstructed to their originals with the same ID**
+- The split is effectively undone for that curve
+- `splitAllCurves → mergeBack` (no trim) is a complete round-trip no-op
+
+### Non-intersecting curves
+Curves in the `NoneSplitted` container (returned by `splitAllCurves` with their original IDs):
+- If NOT trimmed: keep original ID, unchanged
+- If trimmed (via original ID): **deleted entirely** after mergeBack
+
+### Points
+Sketch points are completely unaffected by the entire split/trim/merge workflow. They keep their IDs.
+
+## ID Preservation Rules
+
+| Scenario | After mergeBack |
+|---|---|
+| Curve split, no segments trimmed | **Same ID** — original reconstructed |
+| Curve split, some segments trimmed | **New IDs** — remaining segments get new IDs |
+| Curve split, all segments trimmed | **Deleted** — curve gone |
+| Non-intersecting curve, not trimmed | **Same ID** — unchanged |
+| Non-intersecting curve, trimmed | **Deleted** — curve gone |
+| Points | **Same ID** — always unaffected |
+
+## When mergeBack is a No-Op
+
+All of these are safe — return VOID/null, maxLevel=31, no error:
+- No prior `splitAllCurves` call
+- After `splitCurves` (manual split — different system, no staged state)
+- `splitAllCurves → mergeBack` with no `trimCurves` in between
+- Calling mergeBack twice in a row (second call is harmless)
+- Empty sketch
+- Single curve with no intersections
+
+## Repeated Cycles
+
+You can split and merge the same sketch repeatedly
+Each cycle gets fresh split IDs. No state accumulates between cycles.
+
+## Gotchas
+
+- **No return data.** Must call `getGeometry` afterward to discover new IDs.
+- **All old IDs for trimmed curves are invalid after mergeBack.**
+- **Untrimmed curves keep their IDs.**
+- **splitAllCurves segment ordering follows creation order.**
+- **Only works with splitAllCurves.** No effect after `splitCurves`.
+
+## Common Errors / Working Example / Related
+
+(Full content in the file)
```

## Modified: `references/sketch/splitAllCurves.md`

```diff
-Result ordering is **deterministic**: segments are grouped by original curve in creation order, then by part number (`_part0`, `_part1`, ...) within each curve.
+Result ordering is **deterministic**: segments are grouped by original curve in **creation order** (the order you called the curve-creation APIs), then by part number (`_part0`, `_part1`, ...) within each curve. If you created a line first and a circle second, the line's segments appear before the circle's segments in the result array.
```
