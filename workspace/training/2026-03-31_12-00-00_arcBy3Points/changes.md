# Changes — curve.arcBy3Points training

## New file: `references/curve/arcBy3Points.md`

```diff
+# curve.arcBy3Points
+
+Creates one or more arcs defined by three points: start, mid, and end. The three points uniquely determine a circular arc — the mid point controls which side of the chord the arc curves toward.
+
+## Prerequisites
+
+- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)
+
+## Key Parameters
+
+- `id` (required) — shape ID. Must be a shape, not part or EI.
+- `startPos` (required) — `[x, y, z]` start point. Exactly 3 elements.
+- `midPos` (required) — `[x, y, z]` a point on the desired arc. Controls arc direction.
+- `endPos` (required) — `[x, y, z]` end point. Exactly 3 elements.
+
+All four parameters are required. No optional parameters.
+
+## How midPos Works
+
+The `midPos` determines which of the two possible arcs (between start and end) is created:
+- `midPos` above the start-end chord → arc curves upward
+- `midPos` below the chord → arc curves downward
+- Swapping `startPos` and `endPos` does NOT flip the arc — only `midPos` placement controls the direction
+
+The three points define the arc's plane implicitly. No normal vector is needed.
+
+## Gotchas
+
+- **CRITICAL: Collinear points produce an internal error.** German-language internal error "Index 2 ausserhalb des Arraybereichs". Not a clean validation message.
+- **Coincident points produce the same internal error.** start==mid, start==end, all equal — same crash.
+- **No individual arc IDs.** Merged into shape geometry.
+- **Points must be exactly `[x, y, z]`** — no 2D shorthand.
+- **No size limits.** Tiny and nearly-full-circle arcs both work.
+- **Fully 3D.** Arc plane determined by the three points.
+- **Batch errors are per-item.** Valid arcs created despite invalid entries in same batch.
```
