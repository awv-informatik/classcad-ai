# Changes — solid.cone training (2026-04-13)

## New file: `references/solid/cone.md`

```diff
+# solid.cone
+
+Creates a cone or frustum primitive solid within an entity injection feature. A cone is defined by its height and two diameters (bottom and top). Setting one diameter to 0 creates a pointed cone; equal diameters create a cylinder-like shape.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID)
+- `height` — total height along Z-axis. Cone extends from z=-height/2 to z=+height/2.
+- `bDiameter` — diameter at the bottom (z=-height/2). This is diameter, not radius.
+- `tDiameter` — diameter at the top (z=+height/2). This is diameter, not radius.
+- `translation`, `rotation`, `rotateFirst` — same semantics as box/cylinder
+
+## Alignment
+
+Cone is **fully centered at origin** (X, Y, AND Z). Z range: [-height/2, +height/2].
+Differs from cylinder (z=0 to z=height) and box (corner at origin).
+
+## Key Findings
+
+- `tDiameter: 0` creates a proper pointed cone (docs example uses 0.1 but 0 works)
+- `bDiameter: 0` creates an inverted point — diameters fully symmetric
+- Equal diameters produce a cylinder-like shape
+- Zero/negative dimensions accepted silently (same as box/cylinder)
+- Validation order: bDiameter → height → tDiameter (differs from other primitives)
```
