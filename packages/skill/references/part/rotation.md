# part.rotation

Creates a parametric rotation feature that **rotates target features in place** around an axis (not a copy — for rotated copies use `circularPattern`). Unlike `solid.rotation` (direct, no history), it lives in the feature tree, updatable via `updateRotation` and expression-drivable.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — feature IDs, flat or object format with indices. Multiple targets rotate together; non-targeted features stay fixed.
- `references` — axis: work axis ID, brep edge ID, or two work point IDs `[wp1, wp2]`
- `angle` — **radians** (number or `@expr.NAME`; use `C:PI` in expressions). Default 0.
- `inverted` — numeric `1` reverses to CW, `0` default CCW (not JS booleans). Default 0.
- `name` — default `"Rotation"`

Default direction: CCW viewed from the positive axis direction (right-hand rule).

## Return Value

Feature ID (numeric), maxLevel=31.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RotDemo' })).result
const boxCS = (await api.v1.part.workCSys({ id: partId, name: 'BoxCS', offset: [20, 0, 0] })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 15, height: 20, references: [boxCS] })).result
const waZ = (await api.v1.part.workAxis({ id: partId, name: 'AxisZ', position: [0, 0, 0], direction: [0, 0, 1] })).result

// Rotate 45° CCW around Z
const rId = (await api.v1.part.rotation({
  id: partId, name: 'Rot45', targets: [boxId], references: [waZ], angle: 0.7854,
})).result

// Expression-driven (a rotation consumes its target — rotate the first rotation's result)
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'tilt', value: 'C:PI/6' }] })
const rExpr = (await api.v1.part.rotation({
  id: partId, targets: [rId], references: [waZ], angle: '@expr.tilt',
})).result
```

## Related

`part.updateRotation` · `part.translation` · `part.circularPattern` · `solid.rotation`
