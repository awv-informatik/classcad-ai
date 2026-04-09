# sketch.dimension

Creates dimensional constraints in a sketch. Unlike geometric constraints, dimensions carry a numeric value (length, angle, radius) that can be set and updated.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- Sketch geometry to dimension (lines, points, circles, arcs)

## Key Parameters

- **`id`** (required) — sketch ID.
- **`type`** (required) — one of: `OFFSET`, `HORIZONTAL_DISTANCE`, `VERTICAL_DISTANCE`, `RADIUS`, `DIAMETER`, `ANGLE`, `ANGLEOX`.
- **`geomIds`** (required) — array of sketch geometry IDs. Required count and valid geometry types depend on type (see table below).
- **`name`** (optional) — names the dimension object. Appears in the structure tree.
- **`dimPos`** (optional) — **ANGLE type only.** Position of the dimension text; also selects which angle sector to constrain. Causes error on all other types ("Function InitDimensionByPosition not found").
- **`reflex`** (optional, default FALSE) — **ANGLE type only.** When true, constrains the reflex angle (>180°).
- **`value`** — **BROKEN. Do not use.** Always fails with "Couldn't set the value for dimension" regardless of type or value format. Use `updateDimension` after creation instead.

## Dimension Types and geomIds

| Type | geomIds count | Valid geometry | Measures |
|------|--------------|----------------|----------|
| `OFFSET` | 1 (line) or 2 (line+line, line+point, point+point) | lines, points | Distance along/between geometry |
| `HORIZONTAL_DISTANCE` | 1 (line) or 2 (point+point only) | lines (1), points (2) | Horizontal (X) distance |
| `VERTICAL_DISTANCE` | 1 (line) or 2 (point+point only) | lines (1), points (2) | Vertical (Y) distance |
| `RADIUS` | 1 | circle, arc | Radius |
| `DIAMETER` | 1 | circle, arc | Diameter (2 × radius) |
| `ANGLE` | 2 (non-parallel lines) | lines | Angle between two lines |
| `ANGLEOX` | 1 (non-horizontal line) | line | Angle of line relative to X axis |

**Critical rule for HORIZONTAL_DISTANCE/VERTICAL_DISTANCE with 2 geomIds:** Both must be points. Passing 2 lines or line+point fails with "both must be points."

### Type-Specific Details

**OFFSET** — measures distance along/between geometry. Works with 2 perpendicular lines (not just parallel). With 1 geomId, measures the line's length. With 2 geomIds, measures the perpendicular distance between them. Line+point order doesn't matter.

**HORIZONTAL_DISTANCE** — always measures X-axis projection regardless of line orientation. A vertical line produces a valid dimension measuring 0. No error for degenerate cases.

**VERTICAL_DISTANCE** — always measures Y-axis projection. A horizontal line produces a valid dimension measuring 0.

**RADIUS vs DIAMETER** — both require exactly 1 circle or arc. RADIUS stores value = radius, DIAMETER stores value = 2 × radius. They use different structure classes: `CC_RadialFeatureDimension` (RADIUS) vs `CC_DiameterFeatureDimension` (DIAMETER).

**ANGLE** — requires exactly 2 different, non-parallel lines. Parallel lines and same-line-twice both fail with NullMem evaluation error. Use `dimPos` to select which of the 4 angle sectors to constrain (sector 0-3). Without `dimPos`, auto-selects sector 0 (the acute angle). The `reflex` parameter must be boolean `true`/`false` (NOT string `'TRUE'`); selects the reflex (>180°) sector.

**ANGLEOX** — measures angle from positive X-axis to the line's direction vector (start→end), counter-clockwise. Line direction matters — reversing start/end changes the angle. **Known bug: ANGLEOX at exactly 0° (horizontal line) causes "Division by zero!" error.** The dimension is created but flagged with maxLevel=51. Near-zero angles work fine.

## Return Value

- Single call: returns dimension ID (integer).
- Batch call (array input): returns `Array<id>`.
- On error: returns `null` with maxLevel=51.

**The dimension is created even when `value` errors.** If you pass a `value` param, you get an ID back AND a maxLevel=51 error. The dim exists but with auto-calculated value.

## Critical: Dimensions Do Not Reposition Geometry

Like geometric constraints, dimensions are declarative. Creating or updating a dimension stores the value but does **not** trigger the sketch solver. Geometry stays exactly where it was.

- `updateDimension` returns `result: 0` (false = sketch unsolved) — this is expected.
- There is no operation that forces the sketch solver to run and reposition geometry based on dimensions.

## Working Pattern: Create then Update Value

Since `value` at creation is broken, always use this two-step pattern:

```js
// Step 1: Create with auto-calculated value
const dimId = (await api.v1.sketch.dimension({
  id: skId,
  type: 'OFFSET',
  geomIds: [lineId],
  name: 'width'
})).result

// Step 2: Set the desired value
await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
// or with expression:
await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth' })
```

## Batch Creation

```js
const r = await api.v1.sketch.dimension([
  { id: skId, type: 'OFFSET', geomIds: [line1], name: 'w' },
  { id: skId, type: 'OFFSET', geomIds: [line2], name: 'h' },
])
// r.result = [id1, id2]
```

## updateDimension

See [updateDimension.md](./updateDimension.md) for full documentation. Key facts:

- **`id`** — the dimension ID (not sketch ID). Must be type `"dimension"`.
- **`value`** — numeric, expression (`'@expr.name'`), degree string (`'45deg'`), or unit string (`'50mm'`). No server-side validation — even nonsense strings are accepted.
- Returns `result: 0` (number, sketch unsolved). maxLevel=31 on success.
- Does NOT support batch/array mode.
- Does NOT trigger the sketch solver — geometry stays in place.
- Works regardless of feature open/close state.

## updateDimensionPosition

See [updateDimensionPosition.md](./updateDimensionPosition.md) for full documentation. Key facts:

- **`id`** — the dimension ID (not sketch ID). Must be type `"dimension"`.
- **`pos`** — `[x, y, z]` position. **Z must be exactly 0** (code 1014 error otherwise).
- Returns VOID (null) with maxLevel=31 on success.
- Works on all 7 dimension types.
- Feature-state independent (works with open or closed features).
- **Replaces auto-positioning permanently** — the computed `GetSE(...)` expression on `dimPt` is replaced with a literal `{x,y,z}` string.

## Structure Tree

Dimensions appear as child nodes under the sketch's `CC_SketchDimensionSet`:

- **OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE** → `CC_LinearFeatureDimension`
  - `orientationType`: 0=VD, 1=HD, 2=OFFSET
  - `startPt`, `endPt`: measurement endpoints (line endpoints or point positions)
  - `angle`: measurement direction in radians (0=horizontal, π/2=vertical, line angle for OFFSET)
  - `dimPt`: label position (auto-computed by `GetSE(...)` expression, replaced by literal after `updateDimensionPosition`)
  - `paramName`: `"@value"` (auto-calculated), `""` (numeric set via updateDimension), or expression string (e.g., `"30deg"`)
- **RADIUS** → `CC_RadialFeatureDimension`
  - `value`, `radius`: both reflect actual geometry radius (NOT updated by `updateDimension`)
  - `center`: circle/arc center point
  - `paramName`: same semantics as linear
- **DIAMETER** → `CC_DiameterFeatureDimension`
  - `value`: 2 × radius (reflects geometry, NOT updated by `updateDimension`)
  - `radius`, `center`: same as RADIUS
- **ANGLE, ANGLEOX** → `CC_AngularFeatureDimension`
  - `startPt`, `endPt`, `cornerPt`: angle geometry (for ANGLEOX, startPt = cornerPt + [1,0,0] = X-axis reference)
  - `ccw`: 1=counter-clockwise, 0=clockwise measurement direction
  - `sector`: (ANGLE only) 0-3, which quadrant around the intersection
  - `extendToCorner`: (ANGLEOX only) always 1
  - `paramName`: ANGLE uses `"@userValue"`, ANGLEOX uses `"@value"`

**Reading dimension values:** There is no API to read back the numeric constraint value. `getExpression` does not work on dimension IDs. The `value`/`radius` members in RADIUS/DIAMETER reflect geometry, not the constraint. The `paramName` member indicates whether a value has been set (empty string = set, `"@value"`/`"@userValue"` = auto-calculated).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Wrong number of geometry ids provided for an offset constraint" | Wrong geomIds count for type, or OFFSET on circle | Check type-specific geomIds rules |
| "Datamember radius not found" | RADIUS/DIAMETER on non-circular geometry (line) | Only use RADIUS/DIAMETER on circles/arcs |
| "both must be points" | HORIZONTAL/VERTICAL_DISTANCE with 2 non-point geomIds | Use 1 line, or 2 points |
| "Couldn't set the value for dimension" | Using `value` param at creation | Use `updateDimension` after creation |
| "Function InitDimensionByPosition not found" | Using `dimPos` on non-ANGLE type | Only use `dimPos` with ANGLE |
| code 1013 "value for parameter type is not valid" | Invalid type string | Use one of the 7 valid type strings |
| "Division by zero!" (in SetSE) | ANGLEOX on a perfectly horizontal line (0°) | Avoid ANGLEOX on horizontal lines; use ANGLE with explicit X-axis reference |
| NullMem evaluation error | ANGLE between parallel lines, or same line twice | Lines must be non-parallel and distinct |
| "parameter reflex has wrong type" | `reflex: 'TRUE'` (string) | Use boolean `true`/`false`, not strings |

## Related

- `sketch.constraint` — geometric (non-dimensional) constraints
- `sketch.updateDimension` — change dimension value after creation
- `sketch.updateDimensionPosition` — move dimension text position
- `part.updateExpression` — create named expressions that dimensions can reference
