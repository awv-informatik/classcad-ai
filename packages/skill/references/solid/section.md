# solid.section

Creates cross-section curves by intersecting a solid with an infinite plane. **Non-destructive** — the target solid is preserved and remains fully usable after the call.

## Prerequisites

- A part with an entity injection feature (`part.entityInjection`)
- A solid inside that entity injection (any type: primitive, extrusion, revolve, boolean result)

## Key Parameters

- `id` — entity injection feature ID
- `target` — ID of the solid to section
- `originPos` — `[x, y, z]` point on the cutting plane
- `normal` — `[x, y, z]` direction vector of the plane normal. Only direction matters — magnitude is irrelevant (`[0,0,100]` = `[0,0,1]`). Normal direction affects edge winding order (right-hand rule) but NOT the shape or position of the cross-section.

No optional parameters.

## Return Value

Returns the ID of a `CC_CurveEntity` — a curve container holding the cross-section outline as edge data. The entity is created inside the entity injection as a child.

The section's graphic data is a container with `type: 2` (curves) containing edges:
- **Flat intersections** (box faces, planar surfaces): 2-point straight edges
- **Curved intersections** (spheres, cylinders, cones): multi-point tessellated edges (~65 points for a full circle)
- **Complex solids** (boolean results): multiple edges — straight segments for flat surfaces, tessellated edges for curved ones

Edge IDs are negative (internal/generated).

## CRITICAL: Do NOT deleteSolid a Section

**`solid.deleteSolid(target: sectionId)` deletes the ORIGINAL SOLID, not the section curves.** The CC_CurveEntity resolves to the wrong geometry target — calling deleteSolid on it destroys the solid that was sectioned while the section curves survive. There is no known safe way to programmatically remove section curves without also destroying the source solid.

## Edge Cases

### Non-intersecting plane → empty entity (no error)

If the plane does not intersect the solid, the call succeeds (returns an ID, maxLevel: 31) but the created CurveEntity contains no edges. No error, no warning.

### Zero normal [0,0,0] → empty entity (no error)

Same behavior as non-intersecting: returns an ID, no curves produced.

### Coplanar with a face → produces face outline

Unlike `slice` (which no-ops on some coplanar cases), section at a solid face generates curves tracing the face outline.

### Unnormalized normal

Normal magnitude is irrelevant. `[0,0,100]` behaves identically to `[0,0,1]`.

### Multiple sections on the same solid

Each section creates a separate CC_CurveEntity with its own ID. They all coexist in the entity injection. The original solid can be sectioned any number of times.

## Tested Solid Types

| Type | Result |
|------|--------|
| Box | ✅ 4 straight edges (rectangle) |
| Sphere | ✅ tessellated circle (~65-86 points) |
| Cylinder (horizontal) | ✅ tessellated circle (65 points) |
| Cylinder (diagonal) | ✅ 2 tessellated half-edges (ellipse) |
| Cone | ✅ tessellated circle at interpolated radius |
| Extrusion (L-shaped) | ✅ reproduces original profile (6 straight edges) |
| Boolean result (box - cylinder) | ✅ rectangle + circle hole (5 edges) |

## Gotchas

- **`deleteSolid` trap.** Never call `solid.deleteSolid` on a section entity — it destroys the original solid. See CRITICAL section above.
- **Empty sections are silent.** No-intersection and zero-normal cases return a valid ID with no error. Check the graphic container's edges array to know if curves were actually produced.
- **Curves are tessellated.** Circular/elliptical cross-sections are polygon approximations, not exact analytic curves. Expect ~65 points for a full circle.
- **Normal only affects winding.** Unlike `slice` where normal determines which side is kept/removed, for `section` the normal only changes the edge traversal direction (CCW vs CW by right-hand rule). The cross-section shape is identical.
- **Centered primitives.** Primitives created without `translation` are centered at origin. A box with `height: 40` spans z=-20 to z=20. Plan your `originPos` accordingly.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SectionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

// Create a box (centered: z goes from -20 to 20)
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

// Section at z=0 → produces a rectangle outline (80×60)
const sectionId = (await api.v1.solid.section({
  id: eifId,
  target: boxId,
  originPos: [0, 0, 0],
  normal: [0, 0, 1],
})).result
// sectionId is a CC_CurveEntity ID
// boxId is still valid — section is non-destructive
```

## Related

- `solid.slice` — destructive cut that modifies the solid (removes one side of the plane)
- `solid.subtraction` — boolean subtraction for more complex cuts
- No `updateSection` or `deleteSection` exists — section is a one-shot creation operation
