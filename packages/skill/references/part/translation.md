# part.translation

Creates a parametric translation feature that **moves target features** along a direction (not a copy — for a copy at an offset use `linearPattern` with `count: 2`). Unlike `solid.translation` (direct, no history), it lives in the feature tree, updatable via `updateTranslation` and expression-drivable.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — flat `[featureId]` or `[{ id: featureId, indices: [0] }]`. Multiple targets move together; all other geometry stays in place.
- `references` — direction: work axis ID, brep edge ID, or two work point IDs `[wp1, wp2]` (vector wp1→wp2)
- `distance` — number or `@expr.NAME`. Default 0. `distance: 0` is valid (body stays; placeholder for expression-driven distance).
- `inverted` — numeric `1` reverses, `0` default (not JS booleans). Default 0.
- `name` — default `"Translation"`

## Return Value

Feature ID (numeric), maxLevel=31.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 30, width: 20, height: 25 })).result
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', position: [0, 0, 0], direction: [1, 0, 0] })).result

// Move the box 50mm in +X
const tId = (await api.v1.part.translation({
  id: partId, name: 'MoveRight', targets: [boxId], references: [waX], distance: 50,
})).result

// Expression-driven (a translation consumes its target — move the first translation's result)
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'offset', value: 60 }] })
const tExpr = (await api.v1.part.translation({
  id: partId, targets: [tId], references: [waX], distance: '@expr.offset',
})).result
```

## Related

`part.updateTranslation` · `part.rotation` · `part.transformationByCSys` · `solid.translation`
