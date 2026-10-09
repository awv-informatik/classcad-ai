# Graphics — the graphic payload (protocol version 11)

The graphic payload carries the **tessellated geometry** of the model — one
container per body the part holds (consumed bodies included), plus the curves
of sketches a feature has used. Its model-side counterpart is the structure
tree ([STRUCTURE.md](STRUCTURE.md)); the distilled day-to-day subset is
[DATA.md](DATA.md). The engine sends it in `frame.graphic`; its shape follows
the engine's `graphicProtocolSchema.json`, and live payloads carry fewer
properties than the schema allows — this file describes what arrives.

## Top-level shape

```jsonc
{
  "containers":  [ /* GraphicContainer[] */ ],
  "properties": {
    "version": 11
  }
}
```

A part's graphic data lives in world coordinates. In an assembly the payload
holds one container per template body in template-local coordinates — walk the
structure tree and apply the accumulated `coordinateSystem` transforms (see
[STRUCTURE.md](STRUCTURE.md)).

## GraphicContainer

A container is the renderable bundle for one body or curve. Its `id` is a
graphic id, never a tree node: the same id the part lists in `solids` and the
owner lists in `geometryIdList`, new on every re-tessellation. `owner` is the
tree node it belongs to — the `CC_Solid` for a body, the curve for a sketch
curve.

```jsonc
{
  "id":    <integer>,              // container id (= part.solids / owner.geometryIdList entry)
  "owner": <integer>,              // the CC_Solid (type 1) or the sketch curve (type 2)
  "type":  <integer>,              // 1 body, 2 curve
  "properties": {
    "material": { "color": [r,g,b], "opacity": <number> },   // color 0–255
    "layer":    <string>,
    "min":      [x,y,z],           // bounding-box min
    "max":      [x,y,z],           // bounding-box max
    "chordHeightTol": <number>,    // the tessellation it was built with
    "angleTol":       <number>
  },

  // Payload buckets — a container carries only the ones that apply:
  "meshes":   <Mesh[]>,
  "edges":    <Edge[]>,            // doCurveTessellation on (what scripts run with)
  "lines":    <Line[]>,            // doCurveTessellation off: straight edges ...
  "arcs":     <Arc[]>,             // ... and circular ones
  "vertices": <Vertex[]>
}
```

A body (type 1) carries `meshes`, `edges` and `vertices`; with
`doCurveTessellation` off it carries `meshes`, `lines`, `arcs` and `vertices`
and no `edges` key. The edge ids are the same either way. The schema also
defines `namedPoints`, `cones`, `labels` and `coordinateSystems` buckets.

### Container `type` (runtime field, **not in schema**)

| `type` | Meaning            | Typical payload                        |
| -----: | ------------------ | -------------------------------------- |
|    `0` | The object itself (`id === owner`) | none for a solid or a sketch curve; `coordinateSystems` for a work csys |
|    `1` | Body               | `meshes`, `edges`, `vertices`          |
|    `2` | Curve              | `edges` (+ accumulated across calls)   |

Type 2 covers `curve.*` shapes and the curves of a sketch once a feature has
used it (an unused sketch has no container; a drawing without a body has no
containers). Type 0 containers come from the WASM engine, which also sends the
model objects themselves: an empty one per solid and per used sketch curve, and
one with `coordinateSystems` per work coordinate system — pick bodies by
`type === 1` (or by `meshes`), not by owner alone.

> **Live-protocol gotcha.** For curve containers (type 2), the server only
> pushes graphic data on the **first** curve added to a shape. Subsequent
> curve operations in the same shape return no graphic. A correct client
> cache therefore merges incoming curve containers into the cached set by ID,
> while replacing non-curve containers wholesale on each frame.

## Material & properties

Material lives on the container: `properties.material = { color: [r, g, b]
(0–255), opacity }`, plus `layer` and the bounding box `min`/`max` — useful
for camera fitting and culling. Meshes carry `properties = { operationId,
surface }`; edges, lines, arcs and vertices carry no `properties`.

## Payload buckets

`meshes`, `edges`, `lines`, `arcs` and `vertices` are what parts and
assemblies deliver; the other buckets below follow the schema.

### `meshes` — tessellated faces (solids)

```ts
type Mesh = {
  id: integer
  vertices: number[]      // flat: [x0,y0,z0, x1,y1,z1, ...]
  normals?: number[]      // flat, same length as vertices
  indices: integer[]      // triangle indices into vertices
  loops: integer[][]      // edge IDs per loop; loops[0] is the OUTER loop
  properties: {
    operationId: integer  // op that created this face — links back to features
    surface: Surface      // see below
  }
}
```

`loops` describes the face's boundary topology. The first inner array is
always the outer loop; additional arrays are inner holes. Each entry is an
`Edge.id` from the same container.

### `Surface` (mesh sub-record)

Discriminator is `surface.type`. The other fields populate per type:

```ts
type Surface = {
  type: string                  // 'plane' | 'cylinder' | 'cone' | 'sphere' | 'torus' | ...
  origin?: [x,y,z]              // anchor point
  axis?:   [x,y,z]              // primary axis (cylinder/cone/sphere)
  radius?: number               // cylinder/sphere/torus
  radiusBottom?: number         // cone
  radiusTop?: number            // cone
  height?: number               // cone/cylinder
  pointOnPlane?: [x,y,z]        // plane
  normal?: [x,y,z]              // plane
}
```

These let consumers identify analytic surfaces (cylinder vs free-form spline
patch) without re-deriving from the mesh.

### `edges` — brep edges as polylines

```ts
type Edge = {
  id: integer                   // the edge's brep id (getGeometryIds returns the same)
  points: number[]              // flat [x0,y0,z0, ..., xn,yn,zn]
  pointIds: integer[]           // vertex id per polyline point
}
```

### `lines` — straight edges (curve tessellation off)

Same shape as `edges`, two points each. With `doCurveTessellation` off the
straight edges arrive here and the circular ones in `arcs`.

### `arcs` — circular / arc geometry

```ts
type Arc = {
  id: integer
  center: [x,y,z]
  zAxis:  [x,y,z]               // arc plane normal
  xAxis:  [x,y,z]               // start direction; startPoint = center + radius*xAxis
  angle:  number                // radians; for a full circle this is 2π
  radius: number
  isCircle: boolean             // explicit flag — angle≈2π can be misleading via rounding
  pointIds: integer[]
}
```

### `cones` — analytic cones / cylinders

```ts
type Cone = {
  id: integer
  origin: [x,y,z]
  axis:   [x,y,z]
  diameterBottom: number
  diameterTop:    number        // == diameterBottom for a cylinder
  properties: { material, layer, context? }
}
```

### `vertices` — discrete 3D points

```ts
type Vertex = {
  id: integer
  p: number[]                   // [x,y,z]
}
```

### `namedPoints` — labeled anchor points

```ts
type NamedPoint = {
  id: integer
  label: string
  origin: [x,y,z]
  properties: { material, layer, context? }
}
```

Used for things like sketch dimension anchors, work-point references.

### `labels` — text annotations

```ts
type Label = {
  id: integer
  label: string
  origin: [x,y,z]
  fontSize: number
  properties: { material, layer, context? }
}
```

### `coordinateSystems` — work coordinate systems

```ts
type CoordSys = {
  id: integer
  label: string
  origin: [x,y,z]
  xAxis:  [x,y,z]
  yAxis:  [x,y,z]
  zAxis:  [x,y,z]
  properties: { material, layer, context? }
}
```

These are the **graphic representation** of work geometry (planes, axes).
They're not the assembly transforms — those live in
`structure.tree[*].coordinateSystem`.

## Live access from the WS protocol

When the client's `Configuration` command enables graphics
(`sendGraphic_Kernel`, `sendGraphic_StructureObj`, `sendGraphic_Sketch`),
each Result frame may include a `graphic` block matching the shape above.
Cache it with this merge logic:

- Non-curve containers (type 1) are **replaced** every frame.
- Curve containers (type 2) are **accumulated by ID** across frames, because
  the server only pushes curve data on the first curve op per shape.
- Containers with no `containers[]` and no `properties` are ignored.

The merged cache is what a renderer should consume — it holds the complete
current scene (meshes, edges, sketches, curves).

## Tessellation knobs

Tessellation density (chord-height tolerance, angle tolerance) is controlled
by `v1.common.setDatabaseSettings`:

- `chordHeightTol` — max distance between mesh and exact surface
- `angleTol`       — max angle between adjacent normals, in DEGREES (≥ 1, 0 = off)
- `doCurveTessellation` — on: brep edges as `edges` polylines; off: `lines` + `arcs`
- `isGraphicEnabled` / `isCCGraphicEnabled` / `isSketchGraphicEnabled` — gates
  for which graphic types get pushed

The next pull re-tessellates with new settings — no recalc needed. The
settings are the engine's, not a connection's: every client on it gets the
same ones. The script node session and the classcad-mcp switch on what their
renders need.

## Identifying object provenance

Each mesh's `properties.operationId` points back to the feature/operation
that produced the face. Combined with the container's `owner` (the `CC_Solid`
tree node; walk its parents to the feature and part), this lets you walk
*back* from a rendered face to the part/feature that owns it — useful for
picking, hover-info, and BREP introspection. Skip containers whose owner is
consumed (`members.consumed.value === 1`).
