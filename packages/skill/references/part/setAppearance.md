# part.setAppearance

Sets color, transparency, and faceting quality on a feature or specific solids within it. Identical to `common.setAppearance` (same params, behavior, errors — including the consumed-feature restriction).

## Key Parameters

- **`target`** — feature ID, or `{ id, indices }` for per-solid targeting
  - `indices` — 0-based solids within a multi-solid feature (patterns, entity injections); several allowed (`[0, 2]`); `[]` silently succeeds (no-op); out of range → "objId not found"
- **`color`** — `[r, g, b]`, 0–255. **Exactly 3 elements** (2 or 4 → error 1002). Out-of-range and float values silently accepted (no clamping/validation).
- **`transparency`** — 0 (opaque) to 1 (fully transparent); out-of-range silently accepted
- **`chordHeightTol`** / **`angleTol`** — per-feature faceting tolerances, override global `setFacetingParameters`

**Array form:** pass an array of param objects to style several targets in one call.

## Return Value

`result: null` (VOID). Success is `maxLevel <= 31`.

## Valid Targets

| Target | Works? | Notes |
|---|---|---|
| Part feature (`part.box`, `part.extrusion`, `part.cylinder`, …) | ✅ | Must not be consumed downstream |
| Entity injection feature | ✅ | |
| Direct solid ID (`solid.box`, …) | ✅ | |
| Pattern feature (`linearPattern`, `circularPattern`) | ✅ | Per-instance indices `0`..`count-1` |
| Boolean feature | ✅ | Color the id `part.boolean` returns; its consumed inputs are rejected |
| Part container / sketch / work geometry ID | ❌ | Error 1007 "must be an operation id" |

## Consumed Feature Restriction (Error 1014) — most important gotcha

Each downstream feature (fillet, chamfer, pattern, boolean, …) consumes its predecessor; only the **tip** of the chain accepts appearance settings.

```
Box1 → Fillet1 → Chamfer1
 ❌       ❌        ✅
```

Targeting a consumed feature: `"Entity 'Box1' is not available. It has already been consumed/used in another operation."`

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "must be an operation id" | 1007 | Part, sketch, or work geometry ID |
| "invalid id" | 1006 | ID doesn't exist |
| "color has invalid number of elements! There should be 3" | 1002 | Color not exactly 3 elements |
| "objId not found" | 0 | Index out of range |
| "Entity 'X' is not available. It has already been consumed/used in another operation." | 1014 | Target consumed downstream |
| "target = VOID is not allowed" | 1001 | Target null (e.g. boolean feature returned VOID) |

Appearance persists through OFB save/load.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

// Color + transparency + faceting in one call
await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.3, chordHeightTol: 0.01, angleTol: 1 })

// Array form; { id, indices } selects solids of a multi-solid feature (e.g. pattern instance 2: indices [1])
await api.v1.part.setAppearance([
  { target: boxId, transparency: 0.1 },
  { target: { id: boxId, indices: [0] }, color: [0, 255, 0] },
])
```

## Related

`common.setAppearance` · `common.setFacetingParameters` / `common.getFacetingParameters` · `common.requestVisualisation`
