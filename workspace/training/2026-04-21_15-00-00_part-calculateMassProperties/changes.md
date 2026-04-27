# Changes — part.calculateMassProperties

## New file: `references/part/calculateMassProperties.md`

```diff
+# part.calculateMassProperties
+
+Calculates the center of gravity (COG) and volume of a part, assembly, instance, or individual solid. When called on a part or assembly, sums all contained solids and returns the volume-weighted COG.
+
+## Prerequisites
+
+- The target must contain at least one solid body — **empty parts crash** with an internal NullMem error (no graceful zero-volume return)
+
+## Key Parameters
+
+- **`id`** — accepted types: `part/assembly`, `instance`, `solid`
+  - **Part ID** → sums all solids in the part, COG in part-local coordinates
+  - **Assembly ID** → sums all instances across the assembly tree, COG in assembly coordinates
+  - **Instance ID** → that instance's mass properties in assembly coordinates
+  - **Solid ID** (from `solid.box`, `solid.sphere`, etc.) → single solid, COG in part-local coordinates
+  - **NOT accepted:** feature IDs (`part.box`, `part.extrusion`, etc.), sketch IDs, work geometry IDs, entity injection feature IDs → error 1001
+
+## Return Value
+
+```js
+{
+  result: { cog: { x, y, z }, volume: number } | null,
+  messages: [],
+  maxLevel: 31  // info level on success
+}
+```
+
+- **`cog`** — center of gravity as `{ x, y, z }` **object** (NOT an `[x, y, z]` array, despite docs saying "point")
+- **`volume`** — in mm³ (consistent with mm coordinate system)
+- On error: `result: null`, `maxLevel: 51`
+
+## Volume Accuracy
+
+- **Box:** exact (72000 for 60×40×30)
+- **Curved solids:** small numerical error from B-rep integration (~0.01–0.02%)
+  - Sphere r=25: 65458.95 vs analytical 65449.85 (0.014% off)
+  - Cylinder d=30 h=50: 35342.21 vs analytical 35342.92 (0.002% off)
+  - Truncated cone: ~0.002% off
+
+## COG Behavior
+
+- **Single symmetric solid:** COG at geometric center
+- **Multiple solids:** volume-weighted average of all solid COGs
+- **Assembly:** sums across all instances; instance COGs reported in assembly coordinates
+- **After boolean:** reflects the post-operation geometry (material removed/added)
+- **After fillet/chamfer:** reflects material removal from rounding
+
+## Gotchas
+
+- **Feature IDs don't work** — the most common mistake. Use the part ID, not the feature ID returned by `part.box()` etc.
+- **Empty parts crash** — NullMem server error, not graceful zero
+- **Degenerate cones crash** — `tDiameter=0` causes NullMem error. Use `tDiameter >= 1`.
+- **COG is `{x,y,z}` not `[x,y,z]`** — object with named keys, not array
+
+## Common Errors, Working Examples, Assembly-level usage
+
+(see full file for details)
```
