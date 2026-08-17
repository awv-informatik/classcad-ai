# Changes — sketch.copyFrom training

## New file: `references/sketch/copyFrom.md`

```diff
+# sketch.copyFrom
+
+Copies all sketch geometry and constraints from one sketch to another.
+
+## Prerequisites
+
+- A part (`part.create`)
+- Two sketches — source (`toCopyId`) and destination (`id`). Both must be sketch IDs (from `sketch.create` or `part.sketch`).
+
+## Key Parameters
+
+- **`id`** (required) — destination sketch ID. Receives the copied geometry.
+- **`toCopyId`** (required) — source sketch ID. Geometry is read from here.
+
+Both params must be sketch IDs. Passing a part ID or other object type → error 1001 with message naming the required type `["sketch"]`.
+
+## Return Value
+
+Always `null` (VOID). maxLevel 31 on success, no messages.
+
+## Behavior
+
+- **Merges, does not replace.** Destination keeps all existing geometry. Source geometry is added on top.
+- **Copies constraints.** All constraints from the source sketch are copied to the destination along with geometry.
+- **No offset/translation.** Geometry is copied at the same positions as in the source.
+- **Self-copy is allowed.** Duplicates elements on top of originals.
+- **Empty source is a no-op.**
+- **Works across sketch types.** Feature sketches and EI sketches can be mixed.
+
+## Gotchas
+
+- No IDs of copied elements are returned.
+- Self-copy produces duplicate overlapping geometry.
+
+## Common Errors
+
+- 1001: wrong id type (need sketch IDs)
+- 1006: invalid/non-existent IDs
+
+## Working Example + Related APIs included.
```
