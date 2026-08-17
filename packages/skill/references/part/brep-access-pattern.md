# Brep Geometry Access Pattern

How to find edge and face IDs for `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references. This doc ties together four APIs into a unified workflow.

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

Every topology-changing operation (fillet, chamfer, boolean) invalidates all brep IDs. The pattern is always:

```js
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
const filletId = (await api.v1.part.fillet({
  id: partId,
  references: edges,
  radius: 8,
})).result

// 4. For the next operation: recalc, then re-query
await api.v1.common.recalc({})
const newEdges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 0] }],  // different edge
})).result.lines
```

**Never cache brep IDs across topology changes.** Always recalc + re-query.

## Two Approaches: Position-Based vs Index-Based

### Position-based (`getGeometryIds`)

Best when you know the geometric position of the edge you want.

```js
const edges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 40] }],
})).result.lines
```

**Strengths:** Direct — specify position, get ID. Works with the part ID (always available). Robust across topology changes — same position finds the edge even after its midpoint shifts slightly.

**Weaknesses:** Requires knowing the position. Unreliable for fillet arc edges (their midpoint positions are hard to predict). Requires knowing the edge TYPE (lines vs arcs vs circles — see below).

### Index-based (`getBrepGeometryByIndex`)

Best for enumeration — discovering ALL edges without knowing positions.

```js
const edges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: featureId, lineIndex: i })
  if (r.result === null) break
  edges.push(r.result)
}
```

**Strengths:** Discovers ALL edges. Deterministic — index 0 always exists if any edges exist. Works for arc edges that are hard to find by position.

**Weaknesses:** Requires a feature ID (not part ID). Must use the **latest feature** for current topology. Need to enumerate to find what you want.

### Which feature ID to use

**Always use the latest feature** for `getBrepGeometryByIndex`. The latest feature's brep contains the complete current solid topology. Earlier features have their own brep state which may be outdated:

- Box feature after fillet: may have fewer edges (lost the filleted ones)
- Fillet feature: has all edges including new fillet arcs
- The latest feature always has the most complete view

## Enumerate → Classify → Select Pattern

For selective edge operations (e.g., fillet all top edges, chamfer all bottom edges):

```js
// 1. Enumerate all edges on the latest feature
const allEdges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: latestFeatureId, lineIndex: i })
  if (r.result === null) break
  allEdges.push(r.result)
}

// 2. Get positions for classification
const positions = (await api.v1.part.getGeometryPositions({ elems: allEdges })).result

// 3. Classify by position (e.g., by z-coordinate for top/bottom/vertical)
const topEdges = positions
  .filter(p => Math.abs(p.positions[0].z - height) < 0.1)
  .map(p => p.id)

// 4. Apply operation to the subset
await api.v1.part.fillet({ id: partId, references: topEdges, radius: 6 })
```

This pattern works on any geometry — boxes, boolean unions, extrusions.

## Edge Type Rules: circles vs arcs

**Critical distinction in `getGeometryIds`:**

| Edge origin | Use in `getGeometryIds` | Use in `getBrepGeometryByIndex` |
|---|---|---|
| Cylinder/cone/sphere primitive edges | `circles: [{ pos }]` | `arcIndex` |
| Boolean intersection edges (holes, junctions) | `arcs: [{ pos }]` | `arcIndex` |
| Fillet arc edges | `arcs: [{ pos }]` (unreliable) | `arcIndex` (reliable) |
| Straight edges (box, extrusion, etc.) | `lines: [{ pos }]` | `lineIndex` |

- **Primitive** circular edges (from `part.cylinder`, `part.cone`, `part.sphere`) → use `circles` param
- **Boolean intersection** circular edges (from `part.boolean` SUBTRACTION/UNION) → use `arcs` param
- Both are indexed under `arcIndex` in `getBrepGeometryByIndex`

**When in doubt, enumerate with `getBrepGeometryByIndex`** — it doesn't care about the distinction.

## After Fillet/Chamfer: What Happens to Edges

When a straight edge is filleted:
- The original line edge is **removed** from the brep
- Two new arc edges are created (the fillet tangent edges)
- One new cylindrical face is created (the fillet surface)
- Adjacent faces are trimmed
- Position-based lookup with `lines` at the old position **fails** — the edge no longer exists as a line

To find remaining unfilleted edges, query at positions not affected by the fillet. To find the fillet arcs, use index-based enumeration with `arcIndex`.

## Multi-Step Sequential Pattern

The pattern chains naturally. Each step: recalc → find → operate.

```js
// Step 1: Fillet top edges
await api.v1.common.recalc({})
const topEdges = (await api.v1.part.getGeometryIds({ id: partId, lines: [...] })).result.lines
await api.v1.part.fillet({ id: partId, references: topEdges, radius: 6 })

// Step 2: Chamfer bottom edges
await api.v1.common.recalc({})
const bottomEdges = (await api.v1.part.getGeometryIds({ id: partId, lines: [...] })).result.lines
await api.v1.part.chamfer({ id: partId, references: bottomEdges, distance1: 4 })

// Step 3: Fillet vertical edges
await api.v1.common.recalc({})
const vertEdges = (await api.v1.part.getGeometryIds({ id: partId, lines: [...] })).result.lines
await api.v1.part.fillet({ id: partId, references: vertEdges, radius: 5 })
```

No special handling needed between steps. Position-based lookup reliably finds edges across multiple topology changes.

## Serialization: Persisting Edge References

To save edge references that survive topology changes (e.g., for later modification):

```js
// Save: edge ID → position
const edgeId = ...  // from getGeometryIds
const pos = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0]
const saved = { x: pos.positions[0].x, y: pos.positions[0].y, z: pos.positions[0].z }

// Restore: position → edge ID (after topology changes)
const restored = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [saved.x, saved.y, saved.z] }],
})).result.lines[0]
```

**Note:** `getGeometryPositions` returns `{x, y, z}` objects, but `getGeometryIds` expects `[x, y, z]` arrays. Convert between them.

## Box Edge Midpoint Reference

For a box at origin with dimensions L×W×H:

```
Bottom edges: [L/2,0,0], [L,W/2,0], [L/2,W,0], [0,W/2,0]
Top edges:    [L/2,0,H], [L,W/2,H], [L/2,W,H], [0,W/2,H]
Vertical:     [0,0,H/2], [L,0,H/2], [L,W,H/2], [0,W,H/2]
```

## Common Mistakes

1. **Not calling `recalc()` before `getGeometryIds`** — pre-recalc IDs are preliminary and may not work with all operations (especially TWO_DISTANCES chamfer).

2. **Using `circles` for boolean hole edges** — use `arcs` instead. Circle/arc type depends on edge origin, not shape.

3. **Caching brep IDs across topology changes** — IDs are invalidated by fillet, chamfer, boolean, and other topology operations. Always re-query.

4. **Using an earlier feature ID for `getBrepGeometryByIndex`** — earlier features have stale brep. Use the latest feature.

5. **Trying to find fillet arcs by position** — fillet arc midpoints are at unpredictable parametric positions. Use `getBrepGeometryByIndex` with `arcIndex` instead.

## Related

- `part.getGeometryIds` — position-based brep element lookup
- `part.getGeometryPositions` — get positions for brep element IDs
- `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` — index-based brep access
- `part.fillet` / `part.chamfer` — primary consumers of edge IDs
- `part.workPlane` / `part.workAxis` — can use brep face/edge IDs as references
