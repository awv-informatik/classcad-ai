# part.setAppearance

Sets visual appearance properties (color, transparency, faceting quality) on a part feature or specific solids within a feature. Functionally identical to `common.setAppearance` — same parameters, same behavior, same errors. Use whichever namespace is convenient.

## Prerequisites

- A feature with geometry — `part.box`, `part.extrusion`, `part.fillet`, entity injection features, or direct solid IDs
- The target feature must be the **tip** of its design history chain (not consumed by a downstream feature)

## Key Parameters

- **`target`** — feature ID (plain number) or object `{ id, indices }` for per-solid targeting
  - `indices` — 0-based array selecting specific solids within a multi-solid feature (patterns, entity injections with multiple solids)
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

## Valid Targets

| Target type | Works? | Notes |
|---|---|---|
| Part feature (`part.box`, `part.extrusion`, `part.cylinder`, etc.) | ✅ | Must not be consumed by a downstream feature |
| Entity injection feature | ✅ | |
| Direct solid ID (from `solid.box`, etc.) | ✅ | |
| Pattern feature (`linearPattern`, `circularPattern`) | ✅ | Supports per-instance indexing |
| Part container ID | ❌ | Error 1007: "must be an operation id" |
| Sketch ID | ❌ | Error 1007 |
| Work geometry ID | ❌ | Error 1007 |
| Boolean feature result | ❌ | `part.boolean` returns VOID — no ID to target. Color the input features instead. |

## Consumed Feature Restriction (Error 1014)

**This is the most important gotcha.** When a downstream feature (fillet, chamfer, pattern, etc.) is added after a base feature, the base feature becomes "consumed" and can no longer receive appearance settings.

```
Box1 → Fillet1 → Chamfer1
 ❌       ❌        ✅ (only the tip accepts setAppearance)
```

Each new feature consumes its predecessor. Only the **final feature in the chain** (the "tip") is a valid target. Targeting a consumed feature returns:
- Error 1014: `"Entity 'Box1' is not available. It has already been consumed/used in another operation."`

**Exception:** `part.boolean` returns VOID — it doesn't create a new feature, so the boolean's input features (target and tools) remain valid targets.

**Both `part.setAppearance` and `common.setAppearance` enforce this restriction identically.**

## Return Value

Returns `result: null` (VOID). Success is `maxLevel <= 31`.

## Array Form (Batch)

Accepts an array of param objects to set appearance on multiple targets in one call:

```js
await api.v1.part.setAppearance([
  { target: feature1, color: [255, 0, 0], transparency: 0.3 },
  { target: feature2, color: [0, 0, 255] },
  { target: { id: pattern, indices: [0] }, color: [0, 255, 0] },
])
```

## Pattern Feature Indexing

Linear and circular pattern features support per-instance coloring via indices. A pattern with `count: N` has valid indices `0` to `N-1`.

```js
// Color the 2nd instance of a 4-instance circular pattern
await api.v1.part.setAppearance({
  target: { id: circPatternId, indices: [1] },
  color: [0, 255, 0],
})
```

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "must be an operation id" | 1007 | Target is a part, sketch, or work geometry ID |
| "invalid id" | 1006 | Target ID doesn't exist |
| "color has invalid number of elements! There should be 3" | 1002 | Color array doesn't have exactly 3 elements |
| "objId not found" | 0 | Index out of range for the feature's solids |
| "Entity 'X' is not available. It has already been consumed/used in another operation." | 1014 | Target feature consumed by downstream feature |
| "target = VOID is not allowed" | 1001 | Target is null (e.g., boolean feature returned VOID) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

// Color the box red with 30% transparency
await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.3 })

// Set fine faceting on the same feature
await api.v1.part.setAppearance({ target: boxId, chordHeightTol: 0.01, angleTol: 1 })

// Color + faceting in one call
await api.v1.part.setAppearance({
  target: boxId,
  color: [0, 0, 255],
  transparency: 0.1,
  chordHeightTol: 0.5,
  angleTol: 10,
})
```

## Persistence

Appearance properties persist through OFB save/load cycles.

## Related

- `common.setAppearance` — identical behavior, different namespace
- `common.setFacetingParameters` / `common.getFacetingParameters` — global faceting settings
- `common.requestVisualisation` — read back stored appearance data (returns null in CLI mode)
