# Changes: solid.extrusion training

## New file: `references/solid/extrusion.md`

```diff
+# solid.extrusion
+
+Creates a solid by sweeping a closed 2D profile along a direction vector. The profile can come from a curve shape or from sketch elements.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`
+- A closed profile: either a curve shape (`curve.shape` + drawing APIs) or sketch elements that form a closed loop
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID, not shape ID)
+- `direction` — `[x, y, z]` vector. **The magnitude IS the extrusion distance.** `[0, 0, 40]` extrudes 40 units along Z. `[1, 1, 1]` extrudes ~1.73 units along the diagonal. This is NOT a unit direction + separate distance.
+- `curves` — the profile to extrude. Accepts TWO forms:
+  - **Shape ID** (single value) — from `curve.shape`. The shape must contain closed curves.
+  - **Array of sketch element IDs** — from sketch drawing APIs (`sketch.rectangle`, `sketch.line`, etc.). The elements must form a closed loop.
+- `rotation` — `[rx, ry, rz]` Euler angles in radians (optional). Same behavior as primitives.
+- `translation` — `[x, y, z]` offset (optional). Same behavior as primitives.
+- `rotateFirst` — boolean, default `true` (optional). Same behavior as primitives.
+
+## Return Value
+
+Returns an **integer solid ID** on success (e.g., `64`). maxLevel=31, messages=[].
+
+On error, returns `null` with maxLevel=51 and descriptive error messages.
+
+## Profile Types That Work
+
+Any closed 2D profile works:
+- Rectangles (`advancedPolyline` with 4 points, `close: true`)
+- Arbitrary polygons (L-shapes, stars, etc.)
+- Circles (`curve.circle`)
+- Rounded shapes (`advancedPolyline` with `r:` fillet radii at corners)
+- Sketch-drawn geometry (rectangle, lines forming a closed loop)
+
+## Gotchas
+
+- **Open profiles fail.** Error: `"Brep after linear sweep not manifold"` (maxLevel=51).
+- **Zero direction `[0,0,0]` is accepted silently.** Creates degenerate geometry.
+- **Direction magnitude matters.** `[0, 0, 1]` = 1 unit extrusion.
+- **Negative direction is valid.**
+- **No `updateExtrusion` method exists.** Delete and recreate instead.
+
+## Common Errors
+
+| Error | Cause | Fix |
+|---|---|---|
+| `"The parameter \"id\" has a wrong id type!"` (code 1001) | Wrong ID type | Use EIF ID |
+| `"Brep after linear sweep not manifold"` (code 0) | Open profile | Use `close: true` |
+
+## Working Example + Related APIs included
```
