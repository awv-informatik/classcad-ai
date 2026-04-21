# common.setAppearance

Sets visual appearance properties (color, transparency, faceting quality) on a feature or specific solids within a feature.

## Prerequisites

- A feature with geometry — entity injection features, part features (`part.box`, `part.extrusion`, etc.), or direct solid IDs

## Valid Targets

The `target` must be an **operation/feature ID**. Not all IDs work:

| Target type | Works? | Notes |
|---|---|---|
| Entity injection feature ID | ✅ | Primary use case |
| Part feature ID (`part.box`, `part.extrusion`, etc.) | ✅ | |
| Direct solid ID (e.g., from `solid.box`) | ✅ | |
| Part container ID | ❌ | Error 1007: "must be an operation id" |
| Sketch ID | ❌ | Error 1007: "must be an operation id" |
| Work geometry ID (work plane, axis, etc.) | ❌ | Error 1007: "must be an operation id" |
| Pattern feature (`linearPattern`, `circularPattern`) | ✅ | Supports per-instance indexing |
| Boolean feature result | ❌ | `part.boolean` returns VOID — no ID to target |
| Consumed feature (has downstream features) | ❌ | Error 1014: feature consumed by later operation |
| Invalid/nonexistent ID | ❌ | Error 1006: "invalid id" |

## Key Parameters

- **`target`** — feature ID (plain number) or object `{ id, indices }` for per-solid targeting
  - `indices` — 0-based array selecting specific solids within a multi-solid feature
  - Multiple indices in one call: `indices: [0, 2]` works
  - Empty `indices: []` silently succeeds (no-op)
  - Out-of-range index → error: "objId not found"
- **`color`** — `[r, g, b]` array, range 0–255. **Must be exactly 3 elements** — 2 or 4 elements → error 1002
  - Values outside [0,255] silently accepted (no clamping, no validation)
  - Float values accepted
- **`transparency`** — 0 (opaque) to 1 (fully transparent)
  - Values outside [0,1] silently accepted (no validation)
- **`chordHeightTol`** — per-feature chord height tolerance (overrides global `setFacetingParameters`)
- **`angleTol`** — per-feature angle tolerance (overrides global `setFacetingParameters`)

## Return Value

Returns `result: null` (VOID). Success is `maxLevel <= 31`.

## Array Form (Batch)

Accepts an array of param objects to set appearance on multiple targets in one call:

```js
await api.v1.common.setAppearance([
  { target: feature1, color: [255, 0, 0], transparency: 0.3 },
  { target: feature2, color: [0, 0, 255] },
])
```

Can mix plain target IDs and `{ id, indices }` objects in the array.

## Gotchas

- **No range validation** — out-of-range color values (>255, negative) and transparency values (>1, <0) are silently accepted. The API does not clamp.
- **No getAppearance API** — there is no dedicated read-back method. Use `requestVisualisation({ ids: [solidId] })` to observe stored values. Color appears as `containers[].properties.material.color`, transparency as `material.opacity`.
- **Transparency vs opacity are inverses** — `setAppearance` takes `transparency` (0=opaque, 1=transparent) but `requestVisualisation` returns `opacity` (0=transparent, 1=opaque). They are **inverses**: transparency 0.3 → opacity 0.7. Formula: `opacity = 1 - transparency`.
- **Harness renderer ignores color** — the snapshot renderer uses its own per-body color palette. Color/transparency are stored in the model but not visible in harness snapshots. Use `requestVisualisation` to verify.
- **Calling with no properties** — `setAppearance({ target: id })` with no color, transparency, or faceting params is a silent no-op (maxLevel 31).
- **Overwrite behavior** — successive calls on the same target all succeed. Whether unspecified properties are preserved or reset is unverified (no read-back tested between overwrites).
- **Consumed features fail with error 1014** — if a downstream feature (fillet, chamfer, pattern) has consumed a base feature, `setAppearance` on the consumed feature returns error 1014 "Entity 'X' is not available." Only the **tip** (latest) feature in the chain accepts appearance. This applies to both `common.setAppearance` and `part.setAppearance`.

## Per-Feature Faceting

`chordHeightTol` and `angleTol` override the global settings (`setFacetingParameters`) for the specific feature. This is visually confirmed — a sphere with `chordHeightTol: 5.0, angleTol: 45` renders as a coarse polyhedron, while `chordHeightTol: 0.01, angleTol: 1` renders nearly smooth.

Faceting overrides persist through OFB save/load.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "must be an operation id" | 1007 | Target is a part, sketch, or work geometry ID — not a feature |
| "invalid id" | 1006 | Target ID doesn't exist |
| "color has invalid number of elements! There should be 3" | 1002 | Color array doesn't have exactly 3 elements |
| "objId not found" | 0 | Index out of range for the feature's solids |
| "Entity 'X' is not available. It has already been consumed/used in another operation." | 1014 | Target feature consumed by downstream feature |
| "target = VOID is not allowed" | 1001 | Target is null (e.g., boolean feature returned VOID) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [80, 0, 0] })).result

// Color the whole feature red
await api.v1.common.setAppearance({ target: eifId, color: [255, 0, 0], transparency: 0.3 })

// Color only the second solid green
await api.v1.common.setAppearance({
  target: { id: eifId, indices: [1] },
  color: [0, 255, 0],
})

// Set fine faceting on the feature
await api.v1.common.setAppearance({
  target: eifId,
  chordHeightTol: 0.01,
  angleTol: 1,
})

// Verify via requestVisualisation
const vis = await api.v1.common.requestVisualisation({ ids: [box1] })
// vis.graphic.containers[0].properties.material.color → [255, 0, 0]
// vis.graphic.containers[0].properties.material.opacity → 0.3
```

## Persistence

Appearance properties (color, transparency, faceting) persist through OFB save/load cycles.

## Related

- `part.setAppearance` — identical behavior, different namespace
- `common.requestVisualisation` — read back stored appearance data (returns null in CLI mode)
- `common.setFacetingParameters` / `common.getFacetingParameters` — global faceting settings
- `common.setDatabaseSettings` — global database settings
