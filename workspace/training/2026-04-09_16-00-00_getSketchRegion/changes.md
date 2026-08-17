# Changes — sketch.getSketchRegion training

## New file: `references/sketch/getSketchRegion.md`

```diff
+# sketch.getSketchRegion
+
+Looks up a sketch region by name within a sketch. Returns the region's ID or `null` if not found.
+
+## Prerequisites
+
+- A sketch (`sketch.create` or `part.sketch`)
+- A sketch region created with `sketch.sketchRegion` (with a known name)
+
+## Key Parameters
+
+- `id` — sketch ID (required). Must be a `sketch` type ID — part IDs, curve IDs, etc. are rejected with code 1001.
+- `name` — exact name of the region to find (required). **Case-sensitive** — `"MyRegion"` and `"myregion"` are different names.
+
+## Return Value
+
+- **Found:** `result` = region ID (number), `maxLevel` = 31, `messages` = `[]`
+- **Not found:** `result` = `null`, `maxLevel` = 51, error code 1015
+
+## Gotchas
+
+- **Name matching is case-sensitive.** Only exact matches work.
+- **Name collision trap.** `sketchRegion` silently auto-suffixes names that collide with existing objects.
+- **Default auto-generated names** follow the pattern: first = "SketchRegion", second = "SketchRegion0", etc.
+
+## Common Errors
+
+| Error | Code | Meaning |
+|---|---|---|
+| Couldn't find sketch region with name... | 1015 | Not found |
+| wrong id type! Provide only: ["sketch"] | 1001 | Non-sketch ID |
+| invalid id! | 1006 | Nonexistent ID |
+
+## Working Example + Related APIs included.
```

## Updated: `references/sketch/sketchRegion.md`

```diff
 - **Default naming quirk.** First region is `SketchRegion` (no number)...
+- **Name collision with existing objects.** If you pass a `name` that matches an existing
+  object in the drawing (e.g., default work planes "Top", "Front", "Right"), the system
+  silently auto-suffixes with "0" (e.g., "Right" → "Right0").

-Finds a region by name within a sketch. Returns the region ID or `null` if not found.
+Finds a region by name within a sketch. Returns the region ID or `null` if not found.
+See [getSketchRegion.md](getSketchRegion.md) for full details.
+
+- Name matching is **case-sensitive**
 - Not found → `result: null`, `maxLevel: 51`, error code 1015
+- Beware name collisions — the stored name may differ from the name you passed to `sketchRegion`
```
