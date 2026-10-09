# common.requestVisualisation

Requests tessellated rendering data (meshes, edges, curves) for geometry objects. The way to read back appearance, bounding boxes, mesh data, and faceting parameters.

## Key Parameters

- **`ids`** — array of geometry IDs:

| ID type | Works? | Notes |
|---|---|---|
| Solid ID (`solid.box`, etc.) | ✅ | Primary use — type=1 container |
| Graphic container ID (`container.id`) | ✅ | Same result as the owning solid |
| Shape ID (`curve.shape`) | ✅ | type=2 container with curve data |
| Entity injection / part feature (`part.box`) / part / sketch / work geometry ID | ❌ | `graphic: null`, no error |
| Nonexistent (999999) | ❌ | Error 1006 "invalid id" |
| Zero (0) | ❌ | Error |
| Negative (-1) | 💀 | **CRASHES THE WORKER** — connection lost, process exits, worker must be restarted |

`ids: []` is a no-op: `graphic: null`, maxLevel 31.

## Return Value

`result: null` (VOID). The data is in `r.graphic`:

```js
r.graphic = { containers: [...] /* one per object */, properties: { version: 11 } /* protocol version */ }
```

### Solid containers (type=1)

```js
{
  id: 59,        // graphic container ID (≠ owner; both work as input)
  owner: 61,     // the solid ID you passed
  type: 1,
  properties: {
    material: { color: [128,128,128], opacity: 1 },
    layer: "0",
    min: [-30, -20, -15], max: [30, 20, 15],   // bounding box
    chordHeightTol: 0.1, angleTol: 0,
  },
  meshes: [...],   // triangulated faces: vertices, normals, indices, loops, surface metadata
  edges: [...],    // edge polylines: { id, points, pointIds } (doCurveTessellation 0: `lines` + `arcs` instead)
  vertices: [...], // { id, p: [x, y, z] }
}
```

Each mesh has `properties.surface.type` ("plane", "sphere", "cylinder", …) — identifies face types. Edges come as `edges` under the session's graphic settings (`doCurveTessellation` 1 — the default, and what `api.graphic()` ensures); with `doCurveTessellation` 0 they come as analytic `lines` + `arcs` and there is no `edges` key ([setDatabaseSettings](setDatabaseSettings.md)).

### Curve containers (type=2)

No `meshes`/`vertices`. Circles only → `arcs` of `{ center, zAxis, xAxis, angle, radius, isCircle, pointIds }`; mixed lines + arcs → `edges` (tessellated polylines). Default curve color [0,0,0] vs [128,128,128] for solids.

## Appearance Read-back

The only way to read what `setAppearance` stored: `containers[i].properties.material.color` and `.opacity`. **opacity = 1 − transparency** (`transparency: 0.3` → `opacity: 0.7`).

## Faceting Data

Returned mesh resolution follows the faceting parameters; per-feature faceting (`setAppearance`) overrides global settings and shows in the mesh:

| chordHeightTol | angleTol | Sphere (r=30) vertices |
|---|---|---|
| 0.1 (default) | 0 | 1,827 |
| 5.0 | 45 | 120 |
| 0.01 | 1 | 130,823 |

## Gotchas

- Part-level features (`part.box`) are not directly queryable — their IDs return `graphic: null` silently.
- **Live data.** After booleans, mesh counts and bounding boxes update; consumed solid IDs give error 1006.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "An element of parameter \"ids\" has an invalid id!" | 1006 | ID doesn't exist or was consumed by a boolean |
| "ToId()/TOID() didn't get an existing or valid id." | 0 (warning) | Accompanies the above |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

const r = await api.v1.common.requestVisualisation({ ids: [boxId] })
const c = r.graphic?.containers?.[0]
if (c) {
  console.log('color:', c.properties.material.color)      // [128, 128, 128]
  console.log('opacity:', c.properties.material.opacity)  // 1
  console.log('bbox:', c.properties.min, c.properties.max) // [-30,-20,-15] [30,20,15]
  console.log('keys:', Object.keys(c)) // id, owner, type, properties, meshes, edges, vertices
  console.log('faces:', c.meshes?.length, 'edges:', c.edges?.length, 'vertices:', c.vertices?.length) // 6 12 8
}
```

## Related

`common.setAppearance` · `common.setFacetingParameters` / `common.getFacetingParameters` · `common.setDatabaseSettings`
