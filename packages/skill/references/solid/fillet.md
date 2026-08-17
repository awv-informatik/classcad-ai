# solid.fillet

Creates a fillet (rounded edge) on one or more brep edges within an entity injection feature. Modifies the solid(s) in-place — no new entity is created.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- A solid with edges to fillet (e.g., `solid.box`, `solid.extrusion`, etc.)
- Brep edge IDs obtained via `part.getGeometryIds` or `part.getBrepGeometryByIndex`

## Key Parameters

- `id` — entity injection feature ID (not the solid ID, not the part ID)
- `radius` — fillet radius. Must be positive. Zero is accepted but is a no-op. Negative → error.
- `geomIds` — array of brep edge IDs. These are negative numbers (brep sub-element convention). Can include edges from different solids in the same EIF.

## Return Value

`id[]` — array of solid IDs that were modified. These are the **same IDs** as the solids whose edges were filleted. For a single-solid fillet, returns `[solidId]`. For cross-solid fillet, returns all affected solid IDs.

Returns `null` with `maxLevel: 51` on failure.

## Getting Edge IDs

Two approaches, in order of preference:

### 1. `part.getGeometryIds` (position-based — preferred)

Find edges by specifying a point on the edge (typically the midpoint). More reliable across solid types and survives brep rebuilds.

```js
const geo = await api.v1.part.getGeometryIds({
  id: partId,  // part ID, not EIF
  lines: [{ pos: [40, -30, 0] }],  // midpoint of the target edge
})
const edgeId = geo.result.lines[0]  // e.g., -21
```

### 2. `part.getBrepGeometryByIndex` (index-based)

Enumerate edges by index within a solid. Works well for primitives (box, cylinder, cone). May return nothing for non-primitives (extrusions).

```js
// Line edges (box edges, seam lines)
const edge = (await api.v1.part.getBrepGeometryByIndex({
  id: eifId, lineIndex: 0
})).result  // e.g., -20

// Arc/circle edges (cylinder top/bottom, cone rims)
const arc = (await api.v1.part.getBrepGeometryByIndex({
  id: eifId, arcIndex: 0
})).result  // e.g., -8

// Multiple solids in one EIF — use solidIndex
const edge2 = (await api.v1.part.getBrepGeometryByIndex({
  id: eifId, solidIndex: 1, lineIndex: 0
})).result  // edge from second solid
```

### Edge counts by solid type

| Solid | Line edges | Arc edges | Notes |
|---|---|---|---|
| Box | 12 | 0 | All edges are lines |
| Cylinder | 1 (seam) | 2 (top + bottom circles) | Use `arcIndex` for rim edges |
| Cone | 1 (seam) | 2 (top + bottom circles) | Same as cylinder |
| Extrusion | varies | varies | `lineIndex` may return 0 — use `getGeometryIds` |

## Gotchas

- **Edge IDs invalidate after each fillet call.** A fillet rebuilds the brep topology. Any previously-obtained edge IDs become invalid. Always re-query edges (via `getGeometryIds` or `getBrepGeometryByIndex`) before applying another fillet.
- **Radius limit is geometry-dependent.** There's no simple "radius < half shortest face" rule. On a 40x30x20 box, radius=12 works but radius=16 fails. Test incrementally if unsure.
- **Negative radius → error.** `maxLevel: 51` with misleading "id = VOID" message.
- **Zero radius → silent no-op.** Accepted without error but does nothing.
- **Invalid geomIds → full failure.** Passing non-edge IDs (solid IDs, part IDs, nonexistent IDs) fails the entire call. No partial application.
- **`getBrepGeometryByIndex` without `solidIndex` defaults to solid 0.** When multiple solids exist in one EIF, you must specify `solidIndex` to access edges from each solid.
- **Fillet is irreversible** in entity injection context. No corresponding `deleteFillet` or `updateFillet`. To undo, recreate the solid.

## Common Errors

| Scenario | maxLevel | Message |
|---|---|---|
| Negative radius | 51 | "Set the parameter \"id\" = VOID is not allowed" |
| Non-edge ID in geomIds | 51 | NullMem type error (internal) |
| Nonexistent ID in geomIds | 51 | "Set the parameter \"id\" = VOID is not allowed" |
| Radius too large | 51 | "Set the parameter \"id\" = VOID is not allowed" |
| Stale edge ID (after brep rebuild) | 51 | NullMem type error |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

// Find top edges by position (z=20 for an 80x60x40 centered box)
const geo = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [
    { pos: [0, -30, 20] },   // top front edge midpoint
    { pos: [40, 0, 20] },    // top right edge midpoint
    { pos: [0, 30, 20] },    // top back edge midpoint
    { pos: [-40, 0, 20] },   // top left edge midpoint
  ],
})
const topEdges = geo.result.lines

// Fillet all top edges
const r = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: topEdges })
// r.result = [boxId]  — same solid, modified in-place
```

## Sequential Fillets Pattern

```js
// WRONG — edge IDs invalidated by first fillet
const edge0 = /* ... getBrepGeometryByIndex ... */
const edge1 = /* ... getBrepGeometryByIndex ... */
await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [edge0] })
await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: [edge1] })  // FAILS!

// RIGHT — re-query by position after each fillet
await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [edge0] })
const newEdge = (await api.v1.part.getGeometryIds({
  id: partId, lines: [{ pos: [knownMidpoint] }]
})).result.lines[0]
await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: [newEdge] })  // works
```

## Related

- `part.getGeometryIds` — find brep edges by position (preferred for fillet)
- `part.getBrepGeometryByIndex` — enumerate brep edges by index
- `part.getGeometryPositions` — get edge midpoints (returns `{x, y, z}` objects)
- `solid.offset` — related edge/face operation (offsets entire solid shell)
