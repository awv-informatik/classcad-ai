# sketch.updateDimension

Updates the stored value of a dimensional constraint and recalculates the sketch.

## Prerequisites

- A dimension created with `sketch.dimension` — you need the **dimension ID**, not the sketch ID.

## Key Parameters

- **`id`** (required) — dimension ID (returned by `sketch.dimension`). Must be type `"dimension"` — sketch, part, line, or constraint IDs are rejected with code 1001.
- **`value`** (required) — the new value. Accepts:
  - **Numeric:** `50`, `0.001`, `999999`, `0`, `-50` — all accepted. No validation on range or sign (even negative radius is stored without error).
  - **Expression reference:** `'@expr.myWidth'` — links dimension to a named expression created with `part.updateExpression`.
  - **Degree string:** `'45deg'`, `'90deg'` — for angle dimensions. Also accepted on non-angle types.
  - **Unit string:** `'50mm'` — accepted on all types.
  - **Numeric string:** `'50'` — accepted.
  - **Any string:** `'hello'`, `'@'`, `'@expr.doesNotExist'` — ALL accepted silently with maxLevel=31. No server-side validation of the value parameter whatsoever.

## Return Value

```js
{
  result: 0,        // number — 0 means sketch unsolved (always 0)
  messages: [],     // empty on success
  maxLevel: 31,     // info level on success
  structure: {...}, // full structure tree (present)
  graphic: null     // absent
}
```

- `result` is the **number** `0`, not boolean false. It indicates the sketch solver state: 0 = unsolved.
- On error: `result: null`, `maxLevel: 51`.

## No Batch Mode

Unlike `sketch.dimension()` which accepts array input, `updateDimension` does **not** support batch/array mode. Passing an array causes an internal error ("objId not found"). Update dimensions one at a time.

## No Value Validation

The API stores whatever value you pass without checking:
- Zero and negative values for RADIUS/DIAMETER are accepted
- Non-existent expression references are accepted
- Arbitrary strings are accepted
- Errors would only surface at sketch solve time (which doesn't happen — see below)

## Geometry Does Not Move

`updateDimension` stores the new value but does **not** trigger the sketch solver. Geometry stays exactly where it was. The `result: 0` (unsolved) confirms this. The structure tree's `startPt`/`endPt` remain at their original positions.

## Feature State Independent

`updateDimension` works regardless of whether the sketch feature is open or closed (via `part.closeFeature`/`part.openFeature`). Behavior is identical in all states.

## Expression Linking

When updating with `'@expr.name'`:
- The dimension's `paramName` member in the structure tree changes to `"@value"` (a constant marker).
- When updating back to a numeric value, `paramName` resets to empty `""`.
- The expression name is NOT stored in `paramName` — only the marker `"@value"` indicates an expression link exists.
- Non-existent expression names are silently accepted.

## Common Errors

| Error | Code | Cause | Fix |
|-------|------|-------|-----|
| "wrong id type! Provide only following id types: ["dimension"]" | 1001 | Passed sketch/part/line/constraint ID instead of dimension ID | Use the ID returned by `sketch.dimension()` |
| "ToId() didn't get an existing or valid id" + "invalid id" | 0+1006 | Dimension was deleted or ID doesn't exist | Verify dimension exists before updating |
| "parameter 'value' must be provided" | 1004 | Missing `value` param | Always provide `value` |
| "parameter 'id' must be provided" | 1004 | Missing `id` param | Always provide `id` |

## Working Example

```js
// Create dimension then update its value
const dimId = (await api.v1.sketch.dimension({
  id: skId,
  type: 'OFFSET',
  geomIds: [line1, line2]
})).result

// Numeric update
await api.v1.sketch.updateDimension({ id: dimId, value: 75 })

// Expression link
await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth' })

// Degree string (angle dimensions)
await api.v1.sketch.updateDimension({ id: angleDimId, value: '45deg' })
```

## Related

- `sketch.dimension` — create the dimension this updates
- `sketch.updateDimensionPosition` — move the dimension text/annotation position
- `part.updateExpression` — create named expressions for expression linking
- `sketch.deleteObject` — delete a dimension (updateDimension on deleted dim returns error)
