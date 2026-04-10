# Changes — part.getSketchRegion training

## New file: `references/part/getSketchRegion.md`

```diff
+# part.getSketchRegion
+
+Finds a sketch region by name within a part, searching across all sketches. Returns the region's ID or `null` if not found.
+
+Use this when you know the part but not which sketch contains the region. If you know the sketch, prefer `sketch.getSketchRegion` — it's more precise and avoids the ambiguity of duplicate names.
+
+## Prerequisites
+
+- A part (`part.create`) or instance
+- A sketch region created with `sketch.sketchRegion` (with a known name)
+
+## Key Parameters
+
+- `id` — part or instance ID (required). Accepted types: `["part", "instance"]`. Sketch IDs, curve IDs, etc. are rejected with code 1001.
+- `name` — exact name of the region to find (required). **Case-sensitive** — `"MyRegion"` and `"myregion"` are different names.
+
+## Return Value
+
+- **Found:** `result` = region ID (number), `maxLevel` = 31, `messages` = `[]`
+- **Not found:** `result` = `null`, `maxLevel` = 51, error code 0
+
+## Gotchas
+
+- **Searches all sketches in the part.** If two sketches have regions with the same name, this API returns the **first one found**. The second is unreachable. Use `sketch.getSketchRegion` with the specific sketch ID to disambiguate.
+- **Name collision trap.** `sketchRegion` silently auto-suffixes names that collide with existing objects (e.g., default work planes "Top", "Front", "Right"). A region created with `name: 'Right'` is stored as `"Right0"`. You must look up by the actual stored name.
+- **Case-sensitive matching.** Only exact name matches work.
+- **Error code differs from sketch version.** `part.getSketchRegion` returns error code 0 on not-found; `sketch.getSketchRegion` returns code 1015.
+
+## Common Errors, Working Example, Related APIs included.
```

## Updated: `references/sketch/getSketchRegion.md`

```diff
-- `part.getSketchRegion` — same lookup but takes a part ID instead of sketch ID (searches across all sketches in the part)
+- [`part.getSketchRegion`](../part/getSketchRegion.md) — same lookup but takes a part ID instead of sketch ID (searches across all sketches in the part). Returns the first match if multiple sketches have regions with the same name.
```
