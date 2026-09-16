# part.rotation

Creates a parametric rotation feature that **rotates** target features around an axis. This is a rotation in-place, not a copy — the original body changes orientation in the feature tree.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- A rotation axis reference: work axis, brep edge, or two work points

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to rotate. Accepts flat IDs or object format with indices.
- `references` — rotation axis: work axis ID, brep edge ID, or two work point IDs `[wp1, wp2]`
- `angle` — rotation angle **in radians** (number or `@expr.NAME`). Default 0.
- `inverted` — `1` to reverse rotation direction, `0` for default CCW (numeric). Default 0.
- `name` — feature name (default `"Rotation"`)

## Return Value

Feature ID (numeric) on success, maxLevel=31.

## Gotchas

- **This is a ROTATE in-place, not a copy.** The targeted features change orientation. Non-targeted features remain fixed. For copies at rotated positions, use `circularPattern`.
- **Angle is in radians.** π/2 = 90°, π = 180°, 2π = 360°. Use `C:PI` in expressions.
- **Default rotation is CCW** when viewed from the positive direction of the reference axis (right-hand rule). `inverted: 1` reverses to CW.
- **`inverted` uses numeric 0/1**, not JS booleans.
- **Multiple targets rotate together** around the same axis, maintaining relative positions.
- **Unlike `solid.rotation`** (direct, no history), this creates a feature in the design tree that can be updated via `updateRotation` and driven by expressions.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RotDemo' })).result

const boxCS = (await api.v1.part.workCSys({ id: partId, name: 'BoxCS', offset: [20, 0, 0] })).result
const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  length: 40, width: 15, height: 20,
  references: [boxCS],  // primitives are positioned by a workCSys
})).result

const waZ = (await api.v1.part.workAxis({
  id: partId, name: 'AxisZ',
  position: [0, 0, 0], direction: [0, 0, 1],
})).result

// Rotate 45° CCW around Z
const rId = (await api.v1.part.rotation({
  id: partId,
  name: 'Rot45',
  targets: [boxId],
  references: [waZ],
  angle: 0.7854, // π/4 = 45°
})).result

// Expression-driven rotation
await api.v1.part.expression({
  id: partId,
  toCreate: [{ name: 'tilt', value: 'C:PI/6' }],
})
// A rotation consumes its target — rotate the result of the first rotation
const rExpr = (await api.v1.part.rotation({
  id: partId,
  targets: [rId],
  references: [waZ],
  angle: '@expr.tilt',
})).result
```

## Related

`part.updateRotation` · `part.translation` · `part.circularPattern` · `solid.rotation`
