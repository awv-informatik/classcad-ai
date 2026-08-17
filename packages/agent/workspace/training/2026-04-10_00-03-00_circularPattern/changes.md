# Changes — sketch.circularPattern

## New file: `references/sketch/circularPattern.md`

```diff
+# sketch.circularPattern
+
+Patterns a rigid set (or single geometry element) in a circular arrangement around a center point within a sketch.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)
+- A center point ID — any sketch point: `sketch.point`, or a line/arc endpoint from `sketch.getPoints`
+
+## Key Parameters
+
+- `id` — sketch ID
+- `rigidSetId` — rigid set ID **or** a single geometry ID (auto-wraps into a rigid set internally)
+- `centerId` — ID of the rotation center point. Must be a sketch point ID (from `sketch.point` or `getPoints`). Can be at any position, not just origin.
+- `angle` — angular **spacing** between neighboring copies, in **radians**. This is NOT the total sweep — it's the step between each copy. For N evenly-spaced copies around a full circle: `angle = 2 * Math.PI / count`.
+- `count` — total number of items **including the original**. `count: 4` = original + 3 copies. **Must be ≥ 2** — values ≤ 1 cause a solver error.
+
+## Return Value
+
+- `constraint` — pattern constraint node ID
+- `dimension` — angle dimension ID (always returned, never VOID)
+- `geometry` — array of rigid set IDs, length = count
+- maxLevel 31 on success
+
+## Gotchas
+
+- Count includes original (count=4 → 4 total)
+- Count must be ≥ 2 (≤ 1 → division by zero error)
+- Fractional counts floored (3.7 → 3)
+- Angle is spacing between neighbors, NOT total sweep
+- Negative angle = clockwise (valid)
+- Zero angle = solver error
+- Single geometry ID auto-wraps into rigid set
+- Any sketch point works as center (not just origin)
+- sketch.point uses `pos` not `position`
+
+## Sections included
+
+- Updating Pattern Angle (via updateDimension)
+- Deleting a Pattern (via deleteObject)
+- Common Errors (division by zero, centerId VOID)
+- Working Example (bolt hole circle)
+- Related APIs
```
