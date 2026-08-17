# Changes — solid.sphere training

## New file: `references/solid/sphere.md`

```diff
+# solid.sphere
+
+Creates a sphere primitive solid within an entity injection feature.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID)
+- `radius` — sphere radius (required). Must be > 0.
+- `translation` — `[x, y, z]` offset from origin (optional)
+- `rotation` — `[rx, ry, rz]` rotation in radians (optional). Visually meaningless for sphere but interacts with rotateFirst.
+- `rotateFirst` — boolean, default true. Controls transform order.
+
+## Alignment
+
+- Sphere is **centered at origin** (unlike box which is corner-aligned)
+
+## Mesh Characteristics
+
+- ~2000 vertices, ~3800 triangles
+- 1 topological edge (seam), 2 topological vertices (poles)
+
+## Gotchas
+
+- **radius=0 and negative radius HANG the server** (100% CPU, must kill worker)
+- This is worse than solid.box which silently accepts zero/negative dimensions
+- Very small (0.001) and very large (10000) positive radii work fine
+
+## Common Errors
+
+- Missing radius → code 1004, level 51
+- Wrong id type → code 1001, level 51
+- radius ≤ 0 → server hang (no error returned)
```
