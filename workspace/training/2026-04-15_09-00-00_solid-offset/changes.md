# Changes — solid.offset training session

## New file: `references/solid/offset.md`

```diff
+# solid.offset
+
+Offsets all faces of a solid by a given distance. The target solid is modified **in place** — the returned ID is the same as the target ID. No new solid is created.
+
+**This API is fragile.** It can hang the server on complex topology. Use only on simple solids with a timeout/watchdog.
+
+## Prerequisites
+
+- A part with an entity injection feature (`part.entityInjection`)
+- A solid inside that entity injection (any primitive, extrusion, revolve, or simple boolean result)
+
+## Key Parameters
+
+- `id` — entity injection feature ID (same as for `solid.box`, etc.)
+- `target` — ID of the solid to offset
+- `distance` — offset distance. Positive = outward, negative = inward
+- `extend` (optional, default `FALSE`) — controls how edge gaps are handled:
+  - `FALSE` — fills gaps between offset faces with **fillet surfaces** (radius = distance). Changes topology (adds faces/edges). Produces rounded results.
+  - `TRUE` — extends surfaces beyond their trimming curves to meet each other. **Preserves topology** (same face/edge count). Produces sharp-edged results.
+
+## Return Value
+
+Returns the **same ID** as the target. The solid is modified in place. `r.result === targetId` is always `true`.
+
+## Gotchas
+
+### Server hang on complex topology (CRITICAL)
+
+Offsetting a solid with multiple boolean operations (e.g., 3+ cylinder holes) can cause the server to **hang permanently** at 100% CPU.
+
+### Negative distance with extend: FALSE produces degenerate geometry
+
+**Rule: for inward (negative) offset, always use `extend: TRUE`.**
+
+### No distance validation
+
+The caller must ensure `|distance| < half_smallest_dimension`.
+
+### Zero distance is a no-op
+
+## extend: FALSE vs TRUE comparison table, tested solid types table, working example, related APIs
```
