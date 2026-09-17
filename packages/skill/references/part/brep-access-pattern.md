# Brep Geometry Access Pattern

How to find edge and face IDs for `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references.

## The Four APIs

| API | Input | Output | Use when |
|---|---|---|---|
| `getGeometryIds` | Part ID + positions | Brep element IDs | You know WHERE the edge/face is |
| `getGeometryPositions` | Brep element IDs | Positions | You need to serialize/persist edge references |
| `getBrepGeometryByIndex` | Feature ID + index | Brep element ID | You need to enumerate ALL edges of a type |
| `getBrepGeometryIndex` | Feature ID + brep ID | Index | You need to check which feature owns an edge |

## The Core Pattern

```
create geometry → recalc → find edges → fillet/chamfer → recalc → find edges → next operation
```

Every topology-changing operation (fillet, chamfer, boolean) invalidates all brep IDs:

```js
const partId = (await api.v1.part.create({ name: 'Part' })).result
// 1. Create geometry
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

// 2. Find edges by position
const edges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [
    { pos: [40, 0, 40] },  // top-front edge midpoint
    { pos: [80, 30, 40] }, // top-right edge midpoint
  ],
})).result.lines

// 3. Apply operation
const filletId = (await api.v1.part.fillet({ id: partId, references: edges, radius: 8 })).result

// 4. Next operation: recalc, then re-query
await api.v1.common.recalc({})
const newEdges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 0] }],
})).result.lines
```

**Never cache brep IDs across topology changes.** Always recalc + re-query. The chain repeats for any number of steps (fillet → chamfer → fillet …) with no special handling between steps; position-based lookup reliably finds edges across multiple topology changes.

## Position-Based vs Index-Based

| | `getGeometryIds` (position) | `getBrepGeometryByIndex` (index) |
|---|---|---|
| Best for | You know the edge's position | Enumerating ALL edges |
| ID needed | Part ID (always available) | Feature ID — must be the **latest feature** |
| Strengths | Direct; robust across topology changes — same position finds the edge even after its midpoint shifts slightly | Discovers all edges; deterministic (index 0 exists if any edges exist); works for arc edges hard to find by position |
| Weaknesses | Must know position and edge TYPE (lines/arcs/circles); unreliable for fillet arcs | Must enumerate to find what you want |

```js
const edges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: featureId, lineIndex: i })
  if (r.result === null) break
  edges.push(r.result)
}
```

**Always use the latest feature** for `getBrepGeometryByIndex` — its brep holds the complete current topology. Earlier features keep their own, possibly outdated brep (e.g. the box feature after a fillet may have fewer edges — it lost the filleted ones; the fillet feature has all edges including the new arcs).

## Enumerate → Classify → Select

For selective operations (fillet all top edges, chamfer all bottom edges); works on any geometry — boxes, boolean unions, extrusions:

```js
// latestFeatureId = last feature of the part, H = box height
const allEdges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: latestFeatureId, lineIndex: i })
  if (r.result === null) break
  allEdges.push(r.result)
}
const positions = (await api.v1.part.getGeometryPositions({ elems: allEdges })).result
const topEdges = positions.filter(p => Math.abs(p.positions[0].z - H) < 0.1).map(p => p.id)
await api.v1.part.fillet({ id: partId, references: topEdges, radius: 6 })
```

## Edge Type Rules: circles vs arcs

| Edge origin | `getGeometryIds` param | `getBrepGeometryByIndex` |
|---|---|---|
| Primitive edges (`part.cylinder`/`cone`/`sphere`) | `circles: [{ pos }]` | `arcIndex` |
| Boolean intersection edges (holes, junctions from SUBTRACTION/UNION) | `arcs: [{ pos }]` | `arcIndex` |
| Fillet arc edges | `arcs: [{ pos }]` (unreliable) | `arcIndex` (reliable) |
| Straight edges (box, extrusion, etc.) | `lines: [{ pos }]` | `lineIndex` |

**When in doubt, enumerate with `getBrepGeometryByIndex`** — it doesn't care about the circle/arc distinction.

## After Fillet/Chamfer

When a straight edge is filleted:
- The original line edge is **removed** — `lines` lookup at the old position **fails**
- Two new line edges are created (tangent edges, offset by the radius on each adjacent face); the fillet's end edges are arcs
- One new cylindrical face is created; adjacent faces are trimmed

Find remaining unfilleted edges at unaffected positions. Tangent edges are found with `lines` at their new positions (e.g. r=10 on the top-front edge of a box: [x, 0, H−10] and [x, 10, H]); end arcs via `arcIndex`.

## Serialization: Persisting Edge References

```js
// Save: edge ID → position
const pos = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0]
const saved = [pos.positions[0].x, pos.positions[0].y, pos.positions[0].z]
// Restore after topology changes: position → edge ID
const restored = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: saved }] })).result.lines[0]
```

`getGeometryPositions` returns `{x, y, z}` objects, but `getGeometryIds` expects `[x, y, z]` arrays — convert.

## Box Edge Midpoints (box at origin, L×W×H)

```
Bottom:   [L/2,0,0], [L,W/2,0], [L/2,W,0], [0,W/2,0]
Top:      [L/2,0,H], [L,W/2,H], [L/2,W,H], [0,W/2,H]
Vertical: [0,0,H/2], [L,0,H/2], [L,W,H/2], [0,W,H/2]
```

## Common Mistakes

1. **Using ids from before a later feature change** — query brep ids after the feature they belong to exists; ids from an earlier state can go stale. (A `recalc()` is not required: a TWO_DISTANCES chamfer on ids queried right after `part.box` works.)
2. **Using `circles` for boolean hole edges** — use `arcs`. Circle/arc type depends on edge origin, not shape.
3. **Caching brep IDs across topology changes** — fillet, chamfer, boolean, and other topology operations invalidate them. Re-query.
4. **Using an earlier feature ID for `getBrepGeometryByIndex`** — stale brep. Use the latest feature.
5. **Finding fillet arcs by position** — their midpoints are at unpredictable parametric positions. Use `arcIndex`.

## Related

`part.getGeometryIds` · `part.getGeometryPositions` · `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` · `part.fillet` / `part.chamfer` · `part.workPlane` / `part.workAxis`
