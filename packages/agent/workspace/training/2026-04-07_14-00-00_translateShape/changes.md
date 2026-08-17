# Changes — curve.translateShape training

## New file: `references/curve/translateShape.md`

```diff
+# curve.translateShape
+
+Translates all curves in a shape by a given vector. The translation is in part coordinates.
+
+## Prerequisites
+
+- A shape (`curve.shape`) containing at least one curve
+- **Do NOT call `common.recalc` between shape creation/modification and translateShape** — recalc invalidates shape IDs for this API (see Gotchas)
+
+## Key Parameters
+
+- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
+- `translation` (required) — `[x, y, z]` vector. Translation is **relative/cumulative** — each call adds to the current position. Not absolute.
+
+## Return Value
+
+Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.
+
+## Behavior
+
+- **In-place mutation.** The shape ID remains valid after translation. No new shape is created.
+- **Cumulative.** Three calls with `[10, 0, 0]` = total offset of `[30, 0, 0]`.
+- **All curves move together.** Lines, circles, arcs, polylines — everything in the shape translates as a unit.
+- **Zero vector** `[0, 0, 0]` is a silent noop (maxLevel 31, no error).
+- **Negative values** work as expected (translate in the opposite direction).
+- **Large values** (100000+) work without issue.
+
+## Gotchas
+
+- **`common.recalc` invalidates shape IDs.** After calling `recalc`, `translateShape` fails with error 1006. Workaround: add any curve to the shape after recalc, or avoid recalc before transforms.
+- **Empty shapes cannot be translated.** Error 1006.
+- **Error message says `ids` (plural)** even though the parameter is `id` (singular).
+- The harness `snapshot()` calls `recalc` internally — do transforms BEFORE snapshots.
+
+## Common Errors, Working Example, Related APIs
+(full content in file)
```
