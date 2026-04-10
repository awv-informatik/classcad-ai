# Changes — sketch.getGeometry training

## New file: `references/sketch/getGeometry.md`

```diff
+# sketch.getGeometry
+
+Returns all geometry IDs from a sketch (or subset), grouped by type: `{ points, lines, arcs, circles }`.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`) with geometry
+
+## Key Parameters
+
+- `id` — ID of the scope to query. Accepted types:
+  - **sketch** — returns all geometry in the sketch
+  - **sketchregion** — returns only geometry belonging to that region
+  - **rigidset** — returns geometry in the rigid set
+  - **sketch-curve** (line, arc, circle ID) — returns just that single curve
+  - **sketch-point** — returns just that single point
+
+The last two are undocumented but confirmed working. Passing a curve/point ID effectively answers "does this ID exist and what type is it?"
+
+## Return Value
+
+{
+  result: {
+    points: id[],   // explicit sketch points
+    lines: id[],    // lines (including rectangle edges)
+    arcs: id[],     // ALL arcs (arcByCenter + arcBy3Points merged)
+    circles: id[]   // circles
+  }
+}
+
+Always returns all 4 arrays, even when empty. maxLevel=31 on success.
+
+## Gotchas
+
+- Arc types are merged (arcByCenter + arcBy3Points → single arcs array)
+- Sketch region scopes results to that region only
+- Constraint points are invisible (only explicit geometry)
+- Reflects deletions immediately
+- No update counterpart — use sketch.updateGeometry
+
+## Common Errors
+
+- 1001: wrong id type (accepts sketch, sketchregion, rigidset, sketch-curve, sketch-point)
+- 1006: invalid id
+- 1004: missing id param
+
+## Working Example + Related APIs included
```
