# DATA — the tree & graphic contract for scripts

The distilled contract for `api.tree()` and `api.graphic()` — what the data
looks like and how to select geometry from it. Identical in buerli apps
(browser), the ClassCAD MCP and headless harnesses. Depth: [STRUCTURE.md](STRUCTURE.md)
(model tree), [GRAPHICS.md](GRAPHICS.md) (graphic protocol).

## `api.tree({ refresh? })` → the model

Returns the structure tree: `Record<id, node>`.

```ts
{
  id: number
  class: string              // "CC_Part" | "CC_Solid" | "CC_Sketch" | "CC_Box" |
                             // "CC_WorkPlane" | "CC_ProductReference" | …
  name: string               // "Top", "Sketch", your feature names
  parent: number | null
  children?: number[]        // structural sub-objects (NOT the feature list)
  members?: Record<string, { value: unknown; type: string; expression: string; visible: number }>
  solids?: number[]          // on parts: container id of the latest tessellation (see below)
  coordinateSystem?: number[][] // [origin, xDir, yDir, zDir] where present
}
```

Facts that matter:

- **Tree ids are STABLE** — parts, features, sketches, work planes keep their
  id for the session. Safe to store and reuse across calls.
- Features live under the part's `CC_EntitySet` child, not directly under the
  part; each feature's `CC_Solid` result is a child of the feature. The ordered
  build history is `CC_OperationSequence.children` (each step's
  `members.refObj.value` → the feature/sketch node). Work planes
  (`Top`/`Front`/`Right`) and axes (`XAxis`…) exist on every fresh part.
- `members` carries parameters: `node.members.radius?.value`,
  `members.isConstruction?.value === 1`. A bound param shows
  `expression: "ExpressionSet.NAME"` (you write `'@expr.NAME'` in calls).
  Expressions themselves live in the `CC_ExpressionSet`'s **members**.
- The part's *current* brep is the `CC_Solid` node with
  `members.consumed.value === 0` (superseded solids keep `consumed === 1`).
  `node.solids?.[0]` is the graphic **container id** of the engine's latest
  tessellation — it rotates on every solid-creating feature AND on recalc; the
  stable tree↔graphic join is `container.owner === ccSolid.id`. Re-read after
  mutations; don't cache across features.
- Assemblies: instances are `CC_ProductReference`/`CC_ProductReferenceET`
  nodes — `members.productId.value` → the part/assembly definition,
  `coordinateSystem` = LOCAL placement (accumulate along the reference chain
  for world). Full anatomy + verified walk: [STRUCTURE.md](STRUCTURE.md).

Selection idioms:

```js
// CONTINUATION: a follow-up script attaches to the existing model — tree ids
// are stable, so re-discover instead of re-creating (never part.create twice):
const t = await api.tree({ refresh: true })
const part   = Object.values(t).find(n => n.class === 'CC_Part')
const solids = Object.values(t).filter(n => n.class === 'CC_Solid').map(n => n.id)
const top    = Object.values(t).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
```

## `api.graphic({ recalc? })` → the geometry

Returns the graphic payload: `{ containers: [...] }` — the engine's
tessellation of the CURRENT model, in WORLD coordinates.

```ts
{
  id: number                 // PAYLOAD-LOCAL container id (rotates on recalc)
  owner: number              // the owning CC_Solid TREE id — the stable join
  type: number               // 1 = solid, 2 = curve shape
  properties: { material?: { color: [r, g, b] } }   // 0–255
  meshes: [{                 // ONE MESH PER FACE
    id: number
    material?: { color: [r, g, b] }
    vertices: number[]       // flat [x0,y0,z0, x1,y1,z1, …]
    normals:  number[]       // flat, per-vertex
    indices:  number[]       // triangles
  }]
  edges: [{                  // brep edges as tessellated polylines
    id: number
    points: number[]         // flat [x0,y0,z0, …]
  }]
}
```

Facts that matter:

- **Mesh/edge ids are PAYLOAD-LOCAL.** Re-tessellation (any recalc, any new
  feature) reassigns them — the same face was id 73 in one payload and 72 in
  the next (verified). Use them in the same session state you read them from;
  to hand a face across tool/turn boundaries, pass a **world point on it**.
- **Edge ids from the payload ARE valid feature references** in the same state
  (verified: `part.chamfer({ references: topEdges.map(e => e.id) })`).
- One mesh = one face (a cylinder has 3 meshes: shell + two caps). Filter
  faces by vertex predicates; filter edges by point predicates.
- Full-circle brep edges are seam-split into 2 arcs; the seam azimuth can move
  between regenerations.
- `recalc: false` is MANDATORY in `solid.*`/entity-injection sessions —
  `common.recalc` destroys injected bodies. (Graphic settings are handled for
  you: the node session enables them lazily; buerli apps keep the store live.)

Selection idioms (all verified live):

```js
const g = await api.graphic()

// top edges: derive zTop from the data, keep edges whose EVERY point is at zTop
const edges = g.containers.flatMap(c => c.edges ?? [])
let zTop = -Infinity
for (const e of edges) for (let i = 2; i < e.points.length; i += 3) zTop = Math.max(zTop, e.points[i])
const topEdges = edges.filter(e => {
  for (let i = 2; i < e.points.length; i += 3) if (Math.abs(e.points[i] - zTop) > 1e-9) return false
  return true
})
// NOTE: the z-filter catches EVERY edge at zTop — including bore rims (arcs).
// That chamfers hole rims too (countersink); filter for straightness if you
// only want the outer rectangle.
await api.v1.part.chamfer({ id: partId, references: topEdges.map(e => e.id), distance1: 3 })

// a cylindrical face by radius: every vertex at hypot(x, y) ≈ r
const shell = g.containers.flatMap(c => c.meshes ?? []).find(m => {
  for (let i = 0; i < m.vertices.length; i += 3) {
    if (Math.abs(Math.hypot(m.vertices[i], m.vertices[i + 1]) - r) > 0.01) return false
  }
  return m.vertices.length > 0
})
```

## Which source for which question

| Question | Use |
| --- | --- |
| what exists, names, parameters, feature ids | `api.tree()` — ids stable |
| where geometry actually is, face/edge selection | `api.graphic()` — ids payload-local |
| exact brep coordinates for verification | `v1.part.getGeometryIds` (position-based) + `getGeometryPositions`, or filter the graphic |
| volume/COG proof | `v1.part.calculateMassProperties` |
| bounds | buerli clients: `structure.calculateProductBounds(id)` (positional args; no v1 equivalent) |
