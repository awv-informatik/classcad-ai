# Changes — solid.section training

## New file: `references/solid/section.md`

```diff
+# solid.section
+
+Creates cross-section curves by intersecting a solid with an infinite plane. **Non-destructive** — the target solid is preserved and remains fully usable after the call.
+
+## Prerequisites
+
+- A part with an entity injection feature (`part.entityInjection`)
+- A solid inside that entity injection (any type: primitive, extrusion, revolve, boolean result)
+
+## Key Parameters
+
+- `id` — entity injection feature ID
+- `target` — ID of the solid to section
+- `originPos` — `[x, y, z]` point on the cutting plane
+- `normal` — `[x, y, z]` direction vector of the plane normal. Only direction matters — magnitude is irrelevant (`[0,0,100]` = `[0,0,1]`). Normal direction affects edge winding order (right-hand rule) but NOT the shape or position of the cross-section.
+
+No optional parameters.
+
+## Return Value
+
+Returns the ID of a `CC_CurveEntity` — a curve container holding the cross-section outline as edge data.
+
+## CRITICAL: Do NOT deleteSolid a Section
+
+**`solid.deleteSolid(target: sectionId)` deletes the ORIGINAL SOLID, not the section curves.**
+
+## Edge Cases
+
+- Non-intersecting plane → empty entity (no error)
+- Zero normal [0,0,0] → empty entity (no error)
+- Coplanar with a face → produces face outline
+- Unnormalized normal → works (magnitude irrelevant)
+- Multiple sections → each creates separate CC_CurveEntity
+
+## Tested Solid Types
+
+Box, Sphere, Cylinder (horizontal + diagonal), Cone, Extrusion (L-shaped), Boolean result — all work.
+
+## Gotchas
+
+- `deleteSolid` on section entity destroys the original solid
+- Empty sections are silent (no error)
+- Curves are tessellated (~65 points for a full circle)
+- Normal only affects winding order, not shape
```
