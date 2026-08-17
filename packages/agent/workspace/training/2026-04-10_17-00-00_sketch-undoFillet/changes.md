# Changes — sketch.undoFillet training

## New file: `references/sketch/undoFillet.md`

```diff
+# sketch.undoFillet
+
+Removes a fillet arc and reconnects the original lines, restoring the sharp corner. The inverse of `sketch.fillet`.
+
+## Prerequisites
+
+- A sketch with an existing fillet created by `sketch.fillet`
+- The `arcId` from the fillet's return tuple (first element)
+
+## Key Parameters
+
+- `id` — sketch ID (must be the sketch containing the fillet)
+- `arcId` — the arc ID returned as the first element of the `fillet` result tuple. Must be a `sketch-arc` type ID.
+
+## Return Value
+
+Returns VOID (`null`), maxLevel=31 on success. No messages on success.
+
+## Behavior
+
+- **Removes the fillet arc and its associated points** (controlPoint, startPoint, endPoint) from the sketch.
+- **Restores original lines to their pre-fillet extent.** The same line IDs are preserved — lines are trimmed during fillet but restored to full length on undo.
+- **Other sketch geometry is untouched.** Additional lines, arcs, circles, etc. in the same sketch are not affected.
+- **Each undo is independent.** On a multi-filleted sketch, undoing one fillet does not affect others. You can selectively undo any subset of fillets.
+- **Order does not matter.** FIFO and LIFO both work. There is no required undo sequence.
+
+## Gotchas
+
+- **Double undo fails.** After the first undo, the arcId becomes invalid. A second `undoFillet` with the same arcId produces error code 1006.
+- **Wrong sketch ID fails.** Error: "Arc start/end points should have exactly one coincident point each!"
+- **Only `sketch-arc` IDs accepted.** Code 1001 for non-arc IDs.
+- **After undo, re-filleting produces new IDs.**
+- **Works on all fillet types.** Negative-offset, acute/obtuse angles, manual lines.
+
+## Common Errors table, Working Example, Related sections included.
```

## Modified: `references/sketch/fillet.md`

```diff
 ## undoFillet
 
-`sketch.undoFillet({ id, arcId })` — removes the fillet arc and reconnects the original lines.
+See **[undoFillet.md](undoFillet.md)** for full documentation. Key facts:
 
-- `arcId` — the arc ID from the fillet return tuple (first element).
+- `sketch.undoFillet({ id, arcId })` — pass the `arcId` from the fillet result tuple (first element).
 - Returns VOID (null), maxLevel=31 on success.
-- Invalid `arcId` produces error code 1006.
-- After undo, the same lines can be re-filleted — new IDs are assigned (not the originals).
+- Restores original lines to full length (same line IDs preserved).
+- Each undo is independent — order doesn't matter on multi-filleted sketches.
+- After undo, re-filleting produces new IDs (not the originals).
```
