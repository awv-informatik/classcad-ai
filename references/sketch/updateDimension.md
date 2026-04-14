# sketch.updateDimension

Updates a dimension's value and re-solves the sketch. The solver immediately repositions geometry to match the new value.

## Prerequisites

- A dimension created with `sketch.dimension` — you need the **dimension ID**, not the sketch ID
- The sketch must have been created with `planeId` (otherwise the solver is disabled and result is always 0)

## Key Parameters

- **`id`** (required) — dimension ID (returned by `sketch.dimension`). Only accepts dimension IDs — sketch, line, constraint, etc. are rejected with code 1001.
- **`value`** (required) — the new value. Accepts:
  - **Numbers:** `50`, `3.14`, `0`
  - **Formula strings:** `'50+70'`, `'sqrt(2)*50'`, `'100'`
  - **Angle strings:** `'30deg'`, `'60deg'` (for ANGLE/ANGLEOX dimensions)
  - **NOT expressions:** `@expr.NAME` does NOT work (fails silently with result=0). Neither does bare expression names, `$NAME`, or formula strings referencing expressions. See Gotchas.

## Return Value

```js
{
  result: 0 | 1 | 2,   // solver state (NOT boolean despite docs)
  messages?: [...],
  maxLevel?: real,
  structure: {...},     // full structure tree
  graphic: null
}
```

**Result is a solver state, not a boolean:**

| Value | Meaning | When |
|-------|---------|------|
| `0` | Not solved / solver failed | Over-constrained, negative value, expression string, conflicting constraints |
| `1` | Solved, under-constrained | Some degrees of freedom remain (e.g., circle with RADIUS dim but no center constraint) |
| `2` | Well-constrained | Fully determined — no remaining DOF |

**result=0 does NOT mean error.** maxLevel is still 31 (info). Check `result > 0` for success, not `result === true`.

## Works on All 7 Dimension Types

| Type | Tested | Notes |
|------|--------|-------|
| OFFSET | ✅ | Line length changes |
| HORIZONTAL_DISTANCE | ✅ | X extent changes |
| VERTICAL_DISTANCE | ✅ | Y extent changes |
| RADIUS | ✅ | Circle radius changes (circle must not be FIXATION-locked) |
| DIAMETER | ✅ | Circle diameter changes (value = diameter, radius = value/2) |
| ANGLE | ✅ | Line angle changes (use `'30deg'` syntax) |
| ANGLEOX | ✅ | Line-to-X-axis angle changes |

## Gotchas

- **Expression binding does NOT work for dimensions.** The API docs show `value: '@expr.distance1'` but this fails silently (result=0, no error, geometry unchanged). Neither `@expr.NAME`, bare expression names, `$NAME`, nor formula strings referencing expressions work. `linkWithExpression` also fails — dimensions have no linkable `value` member in their structure tree. To drive dimensions parametrically, you must call `updateDimension` with computed numeric values.
- **Return value is NOT boolean.** The API docs say `result: boolean` but actual values are 0, 1, or 2 (solver state enum). Use `result > 0` to check success.
- **Negative values fail silently.** result=0, no error messages, but geometry may partially change to `|value|`. Avoid negative values.
- **Zero is valid.** Collapses geometry to zero length/radius (result=2).
- **Over-constraining returns result=0.** If both endpoints are fixed and you change the dimension, result=0, no error, geometry unchanged.
- **RADIUS/DIAMETER on FIXATION-locked circles:** FIXATION protects circle radius. updateDimension returns result=0 — the solver can't change the radius. Remove FIXATION first.
- **No open/close feature editing required.** Works regardless of feature state.
- **Sequential updates work.** Call updateDimension multiple times — each update re-solves.
- **result=0 doesn't always mean "no change."** For ANGLE/ANGLEOX, the solver may partially converge (geometry moves) but still report 0 if the sketch is under-determined.

## Common Errors

| Error | Code | Cause | Fix |
|-------|------|-------|-----|
| `"wrong id type! Provide only following id types: [\"dimension\"]"` | 1001 | Passed sketch/line/constraint/part ID | Use the dimension ID from `sketch.dimension()` |
| `"The parameter \"value\" must be provided"` | 1004 | Missing `value` param | Always provide `value` |
| `"The parameter \"id\" must be provided"` | 1004 | Missing `id` param | Always provide `id` |
| `"ToId()/TOID() didn't get an existing or valid id"` + `"invalid id"` | 0+1006 | Nonexistent dimension ID | Verify dimension exists |

## Working Example

```js
const partR = await api.v1.part.create({ name: 'Demo' })
const partId = partR.result
const topPlane = Object.values(partR.structure.tree)
  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

// Fix anchor point
const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

// Create dimension (auto-value = 80)
const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result

// Update to 120 — geometry resizes immediately
const r = await api.v1.sketch.updateDimension({ id: dimId, value: 120 })
// r.result = 2 (well-constrained), geometry now 120 wide

// Formula strings work too
await api.v1.sketch.updateDimension({ id: dimId, value: 'sqrt(2)*100' })
// geometry now ~141.4 wide
```

## Related

- `sketch.dimension` — create the dimension this updates
- `sketch.updateDimensionPosition` — move dimension text position (does not change value)
- `sketch.constraint` — geometric constraints (non-dimensional)
- `sketch.deleteObject` — delete a dimension (`ids: [dimId]`)
