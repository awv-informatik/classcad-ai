# Changes — solid.rotation training session

## New file: `references/solid/rotation.md`

```diff
+# solid.rotation
+
+Rotates a solid by a rotation vector `[rx, ry, rz]` in radians. The rotation is applied in Z→Y→X order (Euler angles) around the **part coordinate system origin** — not the body center. The solid is modified in place.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- A solid in that EIF
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
+- `target` — solid ID to rotate. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
+- `rotation` — `[rx, ry, rz]` vector in **radians**. Each component is the rotation around that axis. Required — code 1004 if omitted.
+
+## Return Value
+
+Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].
+
+## Behavior
+
+- **Angles are in radians.** π/2 ≈ 1.5708 = 90°. π ≈ 3.14159 = 180°. 2π ≈ 6.28318 = 360°.
+- **Rotation order is Z→Y→X (Euler angles).** Intrinsic Euler convention.
+- **Combined ≠ sequential.** Single combined call uses Euler decomposition; separate calls rotate around world axes.
+- **Rotation center is the origin.** Body offset from origin will orbit, not spin in place.
+- **Cumulative.** Successive calls stack.
+- **Zero vector is a no-op.**
+- **Negative angles work.**
+- **No upper bound.** Angles >2π wrap naturally.
+- **Works on compound solids.**
+- **No `updateRotation` method exists.**
+- **Order with translation matters.**
+
+## Gotchas, Common Errors, Working Example, Related APIs included.
```
