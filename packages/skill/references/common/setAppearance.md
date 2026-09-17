# common.setAppearance

Sets color, transparency and faceting quality on a feature or specific solids within it.

## Valid Targets

`target` must be an **operation/feature ID**:

| Target type | Works? | Notes |
|---|---|---|
| Entity injection feature ID | ✅ | Primary use case |
| Part feature (`part.box`, `part.extrusion`, …) | ✅ | |
| Direct solid ID (e.g. from `solid.box`) | ✅ | |
| Pattern feature (`linearPattern`, `circularPattern`) | ✅ | Per-instance indexing |
| Boolean feature result | ✅ | The id returned by `part.boolean` (its consumed inputs are rejected) |
| Part container / sketch / work geometry ID | ❌ | 1007: "must be an operation id" |
| Consumed feature (has downstream features) | ❌ | 1014 |
| Invalid/nonexistent ID | ❌ | 1006: "invalid id" |

## Key Parameters

- **`target`** — feature ID, or `{ id, indices }` for per-solid targeting. `indices`: 0-based solids within a multi-solid feature; several at once (`[0, 2]`) work; `[]` silently succeeds (no-op); out of range → "objId not found".
- **`color`** — `[r, g, b]`, 0–255. **Exactly 3 elements** (2 or 4 → 1002). Out-of-range and float values silently accepted (no clamping).
- **`transparency`** — 0 (opaque) to 1 (transparent). Out-of-range silently accepted.
- **`chordHeightTol`** / **`angleTol`** — per-feature faceting, overriding global `setFacetingParameters`.

**Array form:** pass an array of param objects for multiple targets in one call; plain IDs and `{ id, indices }` can be mixed:

```js
await api.v1.common.setAppearance([
  { target: feature1, color: [255, 0, 0], transparency: 0.3 },
  { target: feature2, color: [0, 0, 255] },
])
```

## Return Value

`result: null` (VOID). Success: `maxLevel <= 31`.

## Gotchas

- **No getAppearance API.** Read back with `requestVisualisation({ ids: [solidId] })`: `containers[].properties.material.color` and `material.opacity`.
- **Transparency and opacity are inverses:** `opacity = 1 - transparency` (0.3 → 0.7).
- **Some renderers ignore stored color** (clients with their own per-body palette). Values are stored regardless — verify with `requestVisualisation`.
- **No properties** (`setAppearance({ target: id })`) → silent no-op, maxLevel 31.
- **Overwrite:** successive calls on a target all succeed; whether unspecified properties are preserved or reset is unverified.
- **Consumed features fail with 1014** — once a downstream feature (fillet, chamfer, pattern) consumed a base feature, only the **tip** feature of the chain accepts appearance. Applies to `common.setAppearance` and `part.setAppearance`.
- **Per-feature faceting** is visually confirmed: a sphere with `chordHeightTol: 5.0, angleTol: 45` renders as a coarse polyhedron, `0.01` / `1` nearly smooth.
- **Persistence:** color, transparency and faceting overrides persist through OFB save/load.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "must be an operation id" | 1007 | Target is a part, sketch, or work geometry |
| "invalid id" | 1006 | Target doesn't exist |
| "color has invalid number of elements! There should be 3" | 1002 | Color array length ≠ 3 |
| "objId not found" | 0 | Index out of range |
| "Entity 'X' is not available. It has already been consumed/used in another operation." | 1014 | Consumed by a downstream feature |
| "target = VOID is not allowed" | 1001 | Target is null (e.g. a call returned VOID) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [80, 0, 0] })

// Whole feature red, then only the second solid green
await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.3 })
await api.v1.common.setAppearance({ target: { id: eifId, indices: [1] }, color: [0, 255, 0] })

const vis = await api.v1.common.requestVisualisation({ ids: [box1] })
// vis.graphic.containers[0].properties.material → color [255, 0, 0], opacity 0.7

// Fine faceting on the feature
await api.v1.common.setAppearance({ target: eifId, chordHeightTol: 0.01, angleTol: 1 })
```

## Related

`part.setAppearance` · `common.requestVisualisation` · `common.setFacetingParameters` / `common.getFacetingParameters` · `common.setDatabaseSettings`
