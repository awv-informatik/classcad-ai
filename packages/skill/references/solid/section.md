# solid.section

Creates cross-section curves by intersecting a solid with an infinite plane. **Non-destructive** — the target stays fully usable.

## Key Parameters (no optional ones)

- `id` — entity injection feature ID
- `target` — solid to section (any type: primitive, extrusion, revolve, boolean result)
- `originPos` — `[x, y, z]` point on the plane. Primitives without `translation` are origin-centered (a `height: 40` box spans z=-20..20) — plan accordingly.
- `normal` — `[x, y, z]` plane normal. Magnitude irrelevant (`[0,0,100]` = `[0,0,1]`). Direction only changes edge winding (CCW vs CW, right-hand rule), NOT the shape or position — unlike `slice`, where it picks the removed side.

## Return Value

ID of a `CC_CurveEntity` — a curve container (child of the EIF) holding the outline as edges; its graphic container has `type: 2` (curves). Edge IDs are negative (internal/generated).
- **Flat intersections** (planar faces): 2-point straight edges
- **Curved intersections** (spheres, cylinders, cones): **tessellated** multi-point edges (~65 points for a full circle) — polygon approximations, not analytic curves
- **Boolean results:** multiple edges, straight for flat surfaces, tessellated for curved

## Edge Cases

- **Non-intersecting plane or zero normal `[0,0,0]` → empty entity, silently** (valid ID, maxLevel 31, no warning). Check the graphic container's edges array to know whether curves were produced.
- **Coplanar with a face →** curves tracing the face outline (unlike `slice`, which no-ops on some coplanar cases).
- **Multiple sections** of one solid each create a separate CC_CurveEntity; any number can coexist.

## deleteSolid and sections

`solid.deleteSolid` takes `ids` (**solid** ids only). `deleteSolid({ id: eifId, ids: [sectionId] })` is rejected (`wrong id type ... ["solid"]`) and the source solid stays. Without `ids` it deletes **all** solids in the EIF — passing the section id under another key (e.g. `target`) does exactly that. No `updateSection` / `deleteSection` exists.

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

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SectionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result  // z -20..20

// Section at z=0 → 80×60 rectangle outline; boxId stays valid
const sectionId = (await api.v1.solid.section({
  id: eifId, target: boxId, originPos: [0, 0, 0], normal: [0, 0, 1],
})).result
```

## Related

`solid.slice` (destructive: removes one side of the plane) · `solid.subtraction` (more complex cuts)
