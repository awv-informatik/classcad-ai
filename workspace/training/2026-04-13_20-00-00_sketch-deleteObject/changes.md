# Changes: sketch.deleteObject

## New file: `references/sketch/deleteObject.md`

```diff
+# sketch.deleteObject
+
+Deletes one or more sketch objects — geometry (lines, circles, arcs, points), constraints, dimensions, sketch regions, or rigid sets.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- Valid IDs of objects to delete
+
+## Key Parameters
+
+- **`ids`** (required) — array of IDs to delete. Accepts mixed types in a single call (geometry + constraints + dimensions + regions + rigid sets all at once).
+
+## Return Value
+
+- `result: null` (VOID) on success.
+- `maxLevel: 31` on success (even with empty `ids` array).
+- `maxLevel: 51` on error (invalid/nonexistent IDs).
+
+## Cascading Behavior
+
+**Geometry deletion cascades to dependent objects:**
+- Deleting a line/circle/arc/point **auto-deletes** all constraints and dimensions that reference it. No orphans are left behind.
+
+**Non-geometry deletion does NOT cascade:**
+- Deleting a constraint, dimension, sketch region, rigid set, or pattern constraint preserves underlying geometry.
+
+**Pattern source geometry:**
+- Deleting pattern source removes only that element. Copies survive independently.
+
+## Edge Cases
+
+- Empty `ids: []` — silent no-op (maxLevel=31).
+- Invalid/nonexistent ID — maxLevel=51, code 1006.
+- Double-delete — same error as invalid ID.
+- Passing null — maxLevel=51, code 1001 (wrong type).
+
+## Gotchas
+
+- `ids` is an array, not a single ID.
+- No undo.
+- Multi-delete with mixed valid/invalid IDs: error reported but valid IDs may still be processed.
```
