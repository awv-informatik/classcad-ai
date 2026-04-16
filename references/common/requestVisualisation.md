# common.requestVisualisation

Requests tessellated rendering data (meshes, edges, curves) for specific geometry objects. The primary way to read back appearance properties, bounding boxes, mesh data, and faceting parameters.

## Prerequisites

- Geometry objects must exist — solid IDs (from `solid.box`, `solid.sphere`, etc.) or shape IDs (from `curve.shape`)

## Key Parameters

- **`ids`** — array of geometry IDs. **Only solid IDs and shape/curve IDs work.** Feature IDs, part IDs, entity injection IDs, sketch IDs, and work geometry IDs all return `graphic: null` without error.

## Valid ID Types

| ID type | Works? | Notes |
|---|---|---|
| Solid ID (from `solid.box`, etc.) | ✅ | Primary use case — returns type=1 container |
| Graphic container ID (`container.id`) | ✅ | Also accepted — same result as the owning solid |
| Shape ID (from `curve.shape`) | ✅ | Returns type=2 container with curve data |
| Entity injection feature ID | ❌ | `graphic: null`, no error |
| Part feature ID (`part.box`, etc.) | ❌ | `graphic: null`, no error |
| Part ID | ❌ | `graphic: null`, no error |
| Sketch ID | ❌ | `graphic: null`, no error |
| Work geometry ID | ❌ | `graphic: null`, no error |
| Nonexistent ID (999999) | ❌ | Error 1006 "invalid id" |
| Zero (0) | ❌ | Error |
| Negative (-1) | 💀 | **HANGS SERVER** — 100% CPU, requires kill -9 |

## Return Value

Always returns `result: null` (VOID). The useful data is in `r.graphic`:

```js
r.graphic = {
  containers: [...],       // one per geometry object
  properties: { version: 11 }  // protocol version
}
```

### Solid Containers (type=1)

```js
container = {
  id: 59,           // graphic container ID
  owner: 61,        // solid ID (the one you passed in)
  type: 1,          // 1 = solid
  properties: {
    material: { color: [128,128,128], opacity: 1 },
    layer: "0",
    min: [-30, -20, -15],   // bounding box minimum
    max: [30, 20, 15],      // bounding box maximum
    chordHeightTol: 0.1,
    angleTol: 0,
  },
  meshes: [...],     // triangulated faces (vertices, normals, indices, loops, surface metadata)
  edges: [...],      // edge polylines
  vertices: [...],   // vertex positions
}
```

Each mesh has `properties.surface.type` ("plane", "sphere", "cylinder", etc.) — useful for identifying face types.

### Curve Containers (type=2)

Curve containers have different sub-arrays depending on the curve types:

- **Circles only** → `arcs` array with `{ center, zAxis, xAxis, angle, radius, isCircle, pointIds }`
- **Mixed curves (lines + arcs)** → `edges` array with tessellated polylines
- No `meshes` or `vertices` — curves are wireframe only

Default curve color is [0,0,0] (black) vs [128,128,128] (gray) for solids.

## Appearance Read-back

This is the only way to read appearance properties set via `setAppearance`:

```js
// Set color
await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.3 })

// Read back
const r = await api.v1.common.requestVisualisation({ ids: [solidId] })
r.graphic.containers[0].properties.material.color  // → [255, 0, 0]
r.graphic.containers[0].properties.material.opacity // → 0.7
```

**CRITICAL: opacity = 1 - transparency.** `setAppearance` takes `transparency` (0=opaque, 1=transparent) but `requestVisualisation` returns `opacity` (0=transparent, 1=opaque). They are inverses: transparency 0.3 → opacity 0.7.

## Faceting Data

Faceting parameters are readable AND affect the returned mesh resolution:

| chordHeightTol | angleTol | Sphere (r=30) vertices |
|---|---|---|
| 0.1 (default) | 0 | 1,889 |
| 5.0 (coarse) | 45 | 147 |
| 0.01 (fine) | 1 | 131,845 |

Per-feature faceting (set via `setAppearance`) overrides global settings and is reflected in the returned mesh.

## Gotchas

- **Only works with solid/shape IDs** — feature IDs, part IDs, etc. return `graphic: null` silently (no error). This means part-level features (`part.box`) are not directly queryable.
- **Negative IDs hang the server** — never pass negative values in the `ids` array. Requires `kill -9` to recover.
- **Empty array is a no-op** — `ids: []` returns `graphic: null`, maxLevel 31 (no error).
- **Live data** — returns current geometry state. After booleans, mesh counts and bounding boxes update. Consumed solid IDs become invalid (error 1006).
- **`container.id` ≠ `container.owner`** — `owner` is the solid ID you passed; `id` is the graphic container child. Both work as input to subsequent calls.
- **`graphic.properties.version`** — always 11 (protocol version, not useful for agents).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "An element of parameter \"ids\" has an invalid id!" | 1006 | ID doesn't exist or was consumed by a boolean |
| "ToId()/TOID() didn't get an existing or valid id." | 0 (warning) | Accompanies the above error |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Get rendering data
const r = await api.v1.common.requestVisualisation({ ids: [boxId] })
const c = r.graphic.containers[0]

// Read appearance
console.log('color:', c.properties.material.color)       // [128, 128, 128]
console.log('opacity:', c.properties.material.opacity)    // 1
console.log('bbox:', c.properties.min, c.properties.max)  // [-30,-20,-15] [30,20,15]

// Read mesh data
console.log('faces:', c.meshes.length)       // 6 (one per box face)
console.log('edges:', c.edges.length)        // 12
console.log('vertices:', c.vertices.length)  // 8
```

## Related

- `common.setAppearance` — set color, transparency, faceting (this API reads them back)
- `common.setFacetingParameters` / `common.getFacetingParameters` — global faceting settings
- `common.setDatabaseSettings` — toggle graphic generation
