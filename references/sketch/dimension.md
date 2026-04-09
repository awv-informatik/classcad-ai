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
| `DIAMETER` | 1 | circle, arc | Diameter |
| `ANGLE` | 2 | lines | Angle between two lines |
| `ANGLEOX` | 1 | line | Angle of line relative to X axis |

**Critical rule for HORIZONTAL_DISTANCE/VERTICAL_DISTANCE with 2 geomIds:** Both must be points. Passing 2 lines fails with "both must be points."

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

Dimensions appear as child nodes under the sketch:

- OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE → class `CC_LinearFeatureDimension`
  - Members: `startPt`, `endPt`, `angle`, `orientationType`, `dimPt`, `paramName`
- RADIUS, DIAMETER → class `CC_RadialFeatureDimension`
  - Members: `value`, `radius`, `center`, `dimPt`, `paramName`

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Wrong number of geometry ids provided for an offset constraint" | Wrong geomIds count for type, or OFFSET on circle | Check type-specific geomIds rules |
| "Datamember radius not found" | RADIUS/DIAMETER on non-circular geometry (line) | Only use RADIUS/DIAMETER on circles/arcs |
| "both must be points" | HORIZONTAL/VERTICAL_DISTANCE with 2 non-point geomIds | Use 1 line, or 2 points |
| "Couldn't set the value for dimension" | Using `value` param at creation | Use `updateDimension` after creation |
| "Function InitDimensionByPosition not found" | Using `dimPos` on non-ANGLE type | Only use `dimPos` with ANGLE |
| code 1013 "value for parameter type is not valid" | Invalid type string | Use one of the 7 valid type strings |

## Related

- `sketch.constraint` — geometric (non-dimensional) constraints
- `sketch.updateDimension` — change dimension value after creation
- `sketch.updateDimensionPosition` — move dimension text position
- `part.updateExpression` — create named expressions that dimensions can reference
