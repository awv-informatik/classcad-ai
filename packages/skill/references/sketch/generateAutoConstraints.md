# sketch.generateAutoConstraints

Detects and creates geometric constraints from spatial relationships. Useful when creation order made creation-time auto-detection miss a relationship. Requires a sketch with `planeId`.

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — sketch-curve or sketch-point ID (line; point incl. `getPoints` start/end; circle; arc). **Sketch IDs are rejected**, despite API docs claiming the sketch id auto-constrains all objects: `"The parameter \"geomId\" has a wrong id type! Provide only following id types: [\"sketch-curve\",\"sketch-point\"]"`.
- **`genFixation`** (default `true`) — fixation at origin
- **`genIncidence`** (default `true`) — coincidence (point-on-curve, point-on-point). **The most useful flag.**
- **`genTangency`** (default `true`) — **no observable effect**: geometrically tangent circle+line produced no tangent constraint.
- **`genVertAndHoriz`** (default `true`) — horizontal/vertical

## Return Value

Always VOID — no IDs. To see what was created, diff constraint nodes (`n.class?.includes('Constraint')`) in the structure tree before/after.

## When Is It Useful?

Creation APIs (`line`, `point`, `circle`, `rectangle`, …) already auto-constrain, so calls are usually **no-ops**. It's **idempotent** — never adds duplicates. It adds value when:

- Order prevented detection: a point at (25,0,0) created BEFORE a line (0,0,0)→(50,0,0) — line creation doesn't check pre-existing points; calling on the point adds the point-on-line coincidence.
- Geometry loaded via `loadFrom` (external OFB) may lack auto-constraints entirely.

## Gotchas

- **Null geomId** (e.g. a failed circle/arc creation — create with `centerPos`, not `center`) gives the confusing `"Set the parameter \"geomId\" = VOID is not allowed"`. Check creation succeeded.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'AutoGenDemo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result

const ptId = (await api.v1.sketch.point({ id: skId, pos: [25, 0, 0] })).result
await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] }) // no point-line coincidence yet

// Only coincidence (genIncidence: false would suppress it)
const r = await api.v1.sketch.generateAutoConstraints({
  id: skId, geomId: ptId, genFixation: false, genVertAndHoriz: false, genTangency: false,
})
// r.result null, maxLevel 31; new CC_2DCoincidentConstraint "Auto_Coinc" in the tree
```

## Related

`sketch.constraint` · `sketch.line` · `sketch.loadFrom` · `sketch.getGeometry`
