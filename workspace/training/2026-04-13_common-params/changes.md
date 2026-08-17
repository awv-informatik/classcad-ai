# Changes — Common Solid Parameters (rotation, translation, rotateFirst)

## New file: `references/solid/generic.md`

```diff
+# Common Solid Parameters: rotation, translation, rotateFirst
+
+Every solid creation API (`box`, `sphere`, `cylinder`, `cone`, `extrusion`, `revolve`, `copy`) accepts three optional positioning parameters. They work identically across all solid types.
+
+## Parameters
+
+- **`translation`** — `[x, y, z]` world-space offset from the origin. Moves the solid along each axis.
+- **`rotation`** — `[rx, ry, rz]` Euler angles in **radians**. Applied in **ZYX order**: Z-axis first, then Y-axis, then X-axis (intrinsic ZYX / extrinsic XYZ convention).
+- **`rotateFirst`** — boolean, default `true`. Controls the order when both rotation and translation are provided.
+
+## Transform Order (rotateFirst)
+
+- **`rotateFirst: true`** (default) — **Rotate then translate.** The solid is rotated around the world origin first, then moved to the translated position. Think: "orient the object, then place it."
+- **`rotateFirst: false`** — **Translate then rotate.** The solid is moved to the translated position first, then rotated around the world origin. The solid **orbits** the origin. Think: "place it, then spin the whole scene around origin."
+
+When only one of rotation/translation is provided, `rotateFirst` has no effect (the missing transform is identity).
+
+## Rotation Pivot
+
+Rotation always happens around the **world origin** `(0, 0, 0)` — not the solid's local center.
+
+For primitives like `box` (corner-aligned at origin, extends in +X/+Y/+Z), this means the corner stays at origin during rotation, not the center. A `sphere` (centered at origin) rotates around its center by default because its center coincides with the origin.
+
+**To rotate around a solid's own center:** use `rotateFirst: false` — translate the solid to where you want it, then apply a rotation. The rotation will orbit the solid around the origin from its translated position.
+
+## Gotchas
+
+- **No validation on values.** Any real number is accepted — zero, negative, greater than 2π. No warnings, no errors. Angles wrap naturally via trigonometry.
+- **Zero vectors are accepted silently.** `rotation: [0, 0, 0]` and `translation: [0, 0, 0]` are no-ops, equivalent to omitting the parameter.
+- **Rotation order matters for compound rotations.** `[π/2, π/4, 0]` applies Z=0 first (no-op), then Y=π/4, then X=π/2. This is NOT the same as `[0, π/4, π/2]`.
+- **Box is NOT centered** — it's corner-aligned at origin. A 90° Z rotation swings the box's length from +X to +Y around the origin corner.
+
+## Usage Hints
+
+- For simple positioning (no rotation), just use `translation`.
+- For angled placement, use `rotation` + `translation` with default `rotateFirst: true` — this orients the solid first, then moves it to position.
+- For circular/radial patterns around the origin, use `rotateFirst: false` — translate to radius distance, then rotate to distribute copies around a circle.
+- Rotation values are in **radians**: 90° = `Math.PI / 2`, 45° = `Math.PI / 4`, 180° = `Math.PI`.
+
+## Working Example
+
+(includes 3 examples: simple translation, rotation+translation with rotateFirst=true, rotateFirst=false orbit pattern)
+
+## Related
+
+- `solid.translation` / `solid.rotation` — post-creation transforms
+- `solid.copy` — duplicate with same rotation/translation/rotateFirst params
+- `common.transformObjectWithMatrix` — arbitrary 4×4 transform matrix
```
