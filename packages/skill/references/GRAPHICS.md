# Graphics (AWV graphic protocol — schema version 9)

The graphic block of an SCG payload (see [STRUCTURE.md](STRUCTURE.md) for the
full envelope) carries the **tessellated geometry** the engine has rendered
for the current model — meshes, edges, sketches, work geometry. It is a
self-describing, JSON Schema-validated message used by both the live WS
protocol (in `frame.graphic`) and the SCG export format.

Source: the engine's `graphicProtocolSchema.json` (schema title: *"AWV
Client/Server graphic protocol (version 9) schema"*), verified against live
server behavior.

## Top-level shape

```jsonc
{
  "containers":  [ /* GraphicContainer[] — required, ≥1 */ ],
  "properties": {
    "version": 9                   // required, integer ≥ 9
  }
}
```

All graphic data lives at the **global origin**. To render an assembly
correctly, walk the structure tree and apply the accumulated
`coordinateSystem` transforms (see [STRUCTURE.md](STRUCTURE.md)).

## GraphicContainer

A container is the renderable bundle for one source object — a solid, a
curve shape, a sketch, etc. The `id` matches an `ObjectID` in the structure
tree. Required keys: `id`, `owner`, `properties`. All other keys are
**optional payload arrays** — a container only carries the buckets that
apply to it (a solid has `meshes` + `edges`, a sketch has `lines` +
`coordinateSystems`, etc.).

```jsonc
{
  "id":    <integer>,              // matches a node in structure.tree
  "owner": <integer>,              // owning node ID (often the structural parent)
  "properties": {
    "material": { "color": [r,g,b], "opacity": <number>,
                  "type": <string>, "linetype": <string> },   // required
    "layer":   <string>,           // required
    "context": <string>,           // optional
    "min":     [x,y,z],            // required — bounding-box min
    "max":     [x,y,z]             // required — bounding-box max
  },

  // Payload buckets (all optional, all min 1 item if present):
  "meshes":            <Mesh[]>,
  "edges":             <Edge[]>,
  "lines":             <Line[]>,
  "vertices":          <Vertex[]>,
  "namedPoints":       <NamedPoint[]>,
  "arcs":              <Arc[]>,
  "cones":             <Cone[]>,
  "labels":            <Label[]>,
  "coordinateSystems": <CoordSys[]>
}
```

### Container `type` (runtime field, **not in schema**)

The schema does not formalise it, but the live WS protocol tags each
container with an integer `type` field that consumers dispatch on. Observed
values:

| `type` | Meaning            | Typical payload                        |
| -----: | ------------------ | -------------------------------------- |
|    `1` | Solid container    | `meshes`, `edges`                      |
|    `2` | Curve container    | `edges` (+ accumulated across calls)   |

> **Live-protocol gotcha.** For curve containers (type 2), the server only
> pushes graphic data on the **first** curve added to a shape. Subsequent
> curve operations in the same shape return no graphic. A correct client
> cache therefore merges incoming curve containers into the cached set by ID,
> while replacing non-curve containers wholesale on each frame.

Other observed types correspond to sketches and work geometry — confirm
empirically when needed (the renderer auto-detects via the payload bucket
shape, not the type tag alone).

## Material & properties shorthand

Every payload item carries the same `properties.material` shape:

```ts
type Material = {
  color: [r: integer, g: integer, b: integer]   // 0–255
  opacity: number                               // 0..1 typically
  type?: string                                 // material variant
  linetype?: string                             // line style for edges/lines
}
```

`layer` and `context` are string tags; `layer` is required on all items,
`context` is optional. The container-level `properties.min`/`max` is the
axis-aligned bounding box for the whole container — useful for camera
fitting and culling.

## Payload buckets

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
    material: Material
    layer: string
    context?: string
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

### `edges` — 3D polylines

```ts
type Edge = {
  id: integer
  points: number[]              // flat [x0,y0,z0, ..., xn,yn,zn]
  pointIds: integer[]           // ID per polyline vertex
  properties: { material, layer, context? }
}
```

### `lines` — 2D / planar polylines (sketches)

Same shape as `edges` (id + points + pointIds + properties). Conceptually
the same, separated for sketches vs 3D edges.

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
  properties: { material, layer, context? }
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
  p: number[]                   // typically [x,y,z]
  properties: { material, layer, context? }
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
- `angleTol`       — max angle between adjacent normals
- `doCurveTessellation` — enable curve discretisation
- `isGraphicEnabled` / `isCCGraphicEnabled` / `isSketchGraphicEnabled` — gates
  for which graphic types get pushed

Rendering clients (e.g. the classcad-mcp `snapshot` tool) typically set the
relevant flags before requesting visualization.

## Identifying object provenance

Each mesh's `properties.operationId` points back to the feature/operation
that produced it. Combined with the container's `id`/`owner` (matching IDs
in the structure tree), this lets you walk *back* from a rendered face to
the part/feature that owns it — useful for picking, hover-info, and BREP
introspection.
