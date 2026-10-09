# DATA — the tree & graphic contract for scripts

The distilled contract for `api.tree()` and `api.graphic()` — what the data
looks like and how to select geometry from it. Identical in buerli apps
(browser), the ClassCAD MCP and headless harnesses. Depth: [STRUCTURE.md](STRUCTURE.md)
(model tree), [GRAPHICS.md](GRAPHICS.md) (graphic protocol).

**Scripts run strict.** An `api.v1.*` call that ends at maxLevel ≥ 51 throws; the error message carries the
engine messages. Method docs that describe a failed lookup as "`null` / `[]` with maxLevel 51" describe the
raw result — in a script, wrap intentional probes (a `getGeometryIds` miss you expect, a `get*` for a name
that may not exist) in `try/catch`. Inside a script, call results carry no model data (`r.structure`
and `r.graphic` are `null`): read the model through `api.tree()` and `api.graphic()`.

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
  solids?: number[]          // on parts: the graphic container id of each live body (see below)
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
- The part's live bodies are the `CC_Solid` nodes with
  `members.consumed.value === 0`; superseded solids keep `consumed === 1` (a
  boolean consumes its tools too). `part.solids` lists the graphic **container
  ids** of the live bodies — new on every re-tessellation (a feature that builds
  the body, `part.updateExpression`, a recalc); the stable tree↔graphic join is
  `container.owner === ccSolid.id`. Re-read after mutations; don't cache across
  features.
- Assemblies: instances are `CC_ProductReference`/`CC_ProductReferenceET`
  nodes — `members.productId.value` → the part/assembly definition (`link`
  exists only on part instances), `name` = the instance name,
  `coordinateSystem` = LOCAL placement (accumulate along the reference chain
  for world). Full anatomy + the walk: [STRUCTURE.md](STRUCTURE.md).

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

Returns the graphic payload: `{ containers: [...] }` — one container per body
the part still holds, CONSUMED ones included, in WORLD coordinates (an
assembly: one per template body, template-local). Keep the containers whose
`owner` is a live `CC_Solid` and that carry `meshes`. No containers (or `null`) while the drawing has no solid.

```ts
{
  id: number                 // container id (= a part.solids entry); new on every re-tessellation
  owner: number              // the owning CC_Solid TREE id — the stable join
  type: number               // 1 = solid, 2 = sketch curve (of a sketch a feature used),
                             // 0 = the object itself (the WASM engine adds an empty one per solid)
  properties: { material: { color, opacity }, layer, min, max, chordHeightTol, angleTol }
  meshes: [{                 // ONE MESH PER FACE
    id: number               // the face's brep id (getGeometryIds returns the same)
    vertices: number[]       // flat [x0,y0,z0, x1,y1,z1, …]
    normals:  number[]       // flat, per-vertex
    indices:  number[]       // triangles
    loops: number[][]        // edge ids per boundary loop, loops[0] = outer
    properties: { operationId, surface }   // surface.type: 'plane' | 'cylinder' | …
  }]
  edges: [{                  // brep edges as tessellated polylines
    id: number               // the edge's brep id
    points: number[]         // flat [x0,y0,z0, …]
    pointIds: number[]
  }]
  vertices: [{ id: number, p: [x, y, z] }]
}
```

Facts that matter:

- **Mesh/edge ids are the brep ids** — the ids `getGeometryIds` returns, valid
  feature references as they stand (`part.chamfer({ references: topEdges.map(e => e.id) })`).
  A feature that builds the body keeps the ids of the faces and edges it does
  not touch and gives new ids to what it creates or cuts; a recalc renumbers
  all; a work plane changes none. To hand a face across tool/turn boundaries,
  pass a **world point on it**.
- **Consumed bodies stay in the payload** with the same ids wherever the
  feature left them alone. Search the live containers only — over all
  containers a top-edge search finds a consumed tool sticking out above the
  result.
- One mesh = one face (a cylinder has 3 meshes: shell + two caps). Filter
  faces by vertex predicates; filter edges by point predicates.
- A full circle is ONE closed edge (its first and last `pointIds` are the same
  vertex); closed surfaces also carry a seam edge (a cylinder's straight line
  at +X).
- `recalc: false` is MANDATORY in `solid.*`/entity-injection sessions — a
  recalc invalidates `curve.*` shape ids and has destroyed injected bodies in
  complex sessions. (Graphic settings are handled for you: the node session
  enables them lazily; buerli apps keep the store live.)

Selection idioms:

```js
// live bodies only: the payload also holds the consumed ones
const cap = await api.inspect.capture()
const live = new Set(api.inspect.currentSolids(cap))
const containers = cap.graphic.containers.filter(c => live.has(c.owner) && c.meshes)

// top edges: derive zTop from the data, keep edges whose EVERY point is at zTop
const edges = containers.flatMap(c => c.edges ?? [])
let zTop = -Infinity
for (const e of edges) for (let i = 2; i < e.points.length; i += 3) zTop = Math.max(zTop, e.points[i])
const topEdges = edges.filter(e => {
  for (let i = 2; i < e.points.length; i += 3) if (Math.abs(e.points[i] - zTop) > 1e-9) return false
  return true
})
// NOTE: the z-filter catches EVERY edge at zTop — including bore rims (arcs).
// That chamfers hole rims too (countersink), and a set with the rim of a bore
// that cuts the outline returned 31 and changed nothing. Filter for
// straightness if you only want the outer rectangle; check the volume after.
await api.v1.part.chamfer({ id: partId, references: topEdges.map(e => e.id), distance1: 3 })

// a cylindrical face by radius: every vertex at hypot(x, y) ≈ r
const shell = containers.flatMap(c => c.meshes ?? []).find(m => {
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
| where geometry actually is, face/edge selection | `api.graphic()` (live owners only) — element ids renumber on a recalc |
| exact brep coordinates for verification | `v1.part.getGeometryIds` (position-based) + `getGeometryPositions`, or filter the graphic |
| volume/COG proof | `v1.part.calculateMassProperties` |
| bounds / bounding box | any script: `const cap = await api.inspect.capture(); api.inspect.graphicBounds(cap, api.inspect.currentSolids(cap))` → `{ min, max }` of the CURRENT solids (tessellated, instance transforms not applied). Without the owner filter the box includes consumed bodies (the pre-boolean box, hole tools) and is wrong. buerli clients also have `api.structure.calculateProductBounds(id)` (positional args, browser-only). No v1 method |
