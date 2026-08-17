# Changes — solid.scale training

## New file: `references/solid/scale.md`

```diff
+# solid.scale
+
+Scales a solid by a uniform factor relative to the **part coordinate system origin**. The solid is modified in place — no new solid is created. Both size and position are affected: an offset body moves further from (or closer to) the origin.
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
+- `target` — solid ID to scale. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
+- `factor` — scale factor (real number). Required — code 1004 if omitted.
+
+All three parameters are required.
+
+## Return Value
+
+Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].
+
+## Behavior
+
+- **Uniform scaling.** All three axes scale by the same factor.
+- **Scale center is the origin.** A body at [100,0,0] scaled 2x ends up at [200,0,0].
+- **Cumulative.** 2x then 3x = 6x total.
+- **Factor=0 is a silent no-op.** Body unchanged. Special-cased.
+- **Very small non-zero factors (0.0001) produce degenerate geometry.**
+- **Negative factors flip normals** — solid becomes inside-out. Use solid.mirror instead.
+- **No updateScale method exists.**
+
+## Gotchas
+
+- Scale center is origin, not body center. Translate → scale → translate back for body-center scaling.
+- Negative factor produces inside-out geometry (normals flip).
+- factor=0 does nothing (silent no-op).
+
+## Common Errors — same pattern as translation/rotation (1001, 1004, 1006)
+
+## Working Example + body-center-scale pattern included.
```
