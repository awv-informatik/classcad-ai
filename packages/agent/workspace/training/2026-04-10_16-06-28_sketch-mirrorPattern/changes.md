# Changes

New file: `references/sketch/mirrorPattern.md`

```diff
+# sketch.mirrorPattern
+
+Mirrors a rigid set (or single geometry element) across a symmetry line within a sketch. Always produces exactly one mirrored copy.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)
+- A symmetry line — must be a **sketch line** ID (from `sketch.line`)
+
+## Key Parameters
+
+- `id` — sketch ID
+- `rigidSetId` — rigid set ID **or** a single geometry ID (auto-wraps into a rigid set internally)
+- `symmetryLineId` — ID of the mirror axis line. **Must be a sketch line** — arcs, circles, and other geometry types are rejected with error 1001.
+
+All three parameters are required. There are no optional parameters.
+
+## Return Value
+
+```js
+{
+  constraint: id,        // pattern constraint node ID
+  geometry: Array<id>    // exactly 2 rigid set IDs: [original, copy]
+}
+```
+
+- `geometry.length` = 2 (always — there is no count parameter)
+- `geometry[0]` = the original rigid set (or auto-created rigid set wrapping a single geometry)
+- `geometry[1]` = the mirrored copy rigid set
+- **No `dimension` or `dimensions` field** — unlike `linearPattern` and `circularPattern`
+- maxLevel is 31 on success
+
+## Gotchas
+
+- **Only sketch lines work as symmetryLineId.** Arcs, circles, and other geometry types produce error 1001.
+- **No update method.** `updateMirrorPattern` does not exist. Delete and recreate to change axis.
+- **No dimension returned.** Unlike linear/circular patterns.
+- **Single geometry ID works as rigidSetId.** Auto-wraps into rigid set.
+- **Symmetry line can be part of the rigid set.** No error.
+- **Geometry on the symmetry line creates an overlapping copy.** No special handling.
+- **Start/end points may swap** in mirrored lines.
+
+## Coordinate Behavior
+
+Mirror reflection is purely geometric. For vertical symmetry at x=S: (x,y) → (2S-x, y).
+
+## Multiple Mirrors
+
+- Same rigid set can be mirrored across multiple lines independently.
+- Copies can be used as rigidSetId for chained pattern operations.
+
+## Deleting a Pattern
+
+`sketch.deleteObject({ ids: [constraintId] })` — mirrored geometry survives.
+
+## Common Errors
+
+- **Wrong ID type** (code 1001, level 51) — non-line geometry as symmetry line
+- **Invalid ID** (code 1006, level 51) — malformed or nonexistent symmetry line ID
+
+## Working Example + Related APIs included.
```
