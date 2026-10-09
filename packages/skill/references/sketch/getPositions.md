# sketch.getPositions

Returns coordinates of a sketch point or curve.

## Key Parameters

- `id` — `sketch-curve` or `sketch-point` ID

## Return Value

`{ x, y, z }` objects (NOT arrays), maxLevel 31:

| Input | Result |
|---|---|
| Point | `{ pos }` |
| Line (incl. each `rectangle` line) | `{ startPos, endPos }` |
| Arc (arcByCenter or arcBy3Points) | `{ startPos, endPos, centerPos }` — no `midPos`; the arcBy3Points midpoint isn't preserved |
| Circle | **FAILS** — see Gotchas |

`getPoints(curveId)` → `getPositions(pointId)` yields identical coordinates. Values reflect `updateGeometry` immediately (no recalc).

## Gotchas

- **⚠️ WORLD coordinates, not sketch-local.** On a Right-plane sketch, local (lx, ly) → world `{x: 0, y: −ly, z: lx}`. Top-plane sketches have local == world, which hides this. Map through the plane basis before verifying solver results on Front/Right/custom planes (probed: Top localXY→XY/+Z; Front x→+X, y→−Z, n→+Y; Right x→+Z, y→−Y, n→+X) — a "solver failure" with uniform large errors on a non-Top plane is usually THIS.
- **Circles fail** despite API docs claiming `{ centerPos }`: `[Evaluation error in SketchAPI_v1.getPositions::PROC:[CCVM::lcm: objId not found]]`. Use `getPoints(circleId)` → `{ centerId }` → `getPositions(centerId)` → `{ pos }`.
- **Float noise** on computed positions, esp. arc `centerPos` (e.g. `-4.44e-16` for `0`).

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | Sketch, part, or other non-geometry ID |
| 1006 | `invalid id` | Nonexistent ID (+ code-0 `ToId()` warning) |
| 1004 | `The parameter "id" must be provided` | Missing `id` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

const linePos = (await api.v1.sketch.getPositions({ id: lineId })).result
// { startPos: { x: 10, y: 20, z: 0 }, endPos: { x: 70, y: 60, z: 0 } }

const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 15 })).result
const { centerId } = (await api.v1.sketch.getPoints({ id: circId })).result
const center = (await api.v1.sketch.getPositions({ id: centerId })).result // { pos: { x: 50, y: 50, z: 0 } }
```

## Related

`sketch.getPoints` · `sketch.getGeometry` · [`sketch.getObjectInfo`](getObjectInfo.md) (kind, circle/arc radius, solver status) · `sketch.updateGeometry` · `sketch.moveGeometry`
