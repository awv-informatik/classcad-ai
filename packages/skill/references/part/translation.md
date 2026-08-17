# part.translation

Creates a parametric translation feature that **moves** target features along a direction. This is a move, not a copy — the original body shifts position in the feature tree.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- A direction reference: work axis, brep edge, or two work points

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to move. Accepts flat IDs `[featureId]` or object format `[{ id: featureId, indices: [0] }]`
- `references` — direction definition: a work axis ID, brep edge ID, or two work point IDs `[wp1, wp2]`
- `distance` — how far to move in the reference direction (number or `@expr.NAME`). Default 0.
- `inverted` — `1` to reverse direction, `0` for default (numeric). Default 0.
- `name` — feature name (default `"Translation"`)

## Return Value

Feature ID (numeric) on success, maxLevel=31.

## Gotchas

- **This is a MOVE, not a copy.** The targeted features physically shift position. Non-targeted features stay where they are. If you want a copy at an offset, use `linearPattern` with `count: 2` instead.
- **`distance: 0` is valid** — creates the feature but body stays in place. Useful as a placeholder for expression-driven distance.
- **`inverted` uses numeric 0/1**, not JS booleans.
- **Two work points define direction** via `references: [wp1, wp2]` — vector from wp1 to wp2.
- **Multiple targets move together**, maintaining their relative positions. Only the targeted features move; all other geometry stays in place.
- **Unlike `solid.translation`** (direct, no history), this creates a feature in the design tree that can be updated via `updateTranslation` and driven by expressions.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransDemo' })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  length: 30, width: 20, height: 25,
})).result

const waX = (await api.v1.part.workAxis({
  id: partId, name: 'AxisX',
  origin: [0, 0, 0], direction: [1, 0, 0],
})).result

// Move the box 50mm in +X
const tId = (await api.v1.part.translation({
  id: partId,
  name: 'MoveRight',
  targets: [boxId],
  references: [waX],
  distance: 50,
})).result

// Expression-driven translation
await api.v1.part.expression({
  id: partId,
  toCreate: [{ name: 'offset', value: 60 }],
})
const tExpr = (await api.v1.part.translation({
  id: partId,
  targets: [boxId],
  references: [waX],
  distance: '@expr.offset',
})).result
```

## Related

- `part.updateTranslation` — modify after creation (requires openFeature/closeFeature)
- `part.rotation` — rotate features around an axis
- `part.transformationByCSys` — transform by coordinate system
- `solid.translation` — direct (non-parametric) translation
