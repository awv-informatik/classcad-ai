# sketch.getObjectsLists

One call that inventories a sketch: every point, curve, constraint and dimension id, with the curves also split into profile (`solidGeometry`) and construction. Use it to collect the curves for `part.extrusion` / `sketchRegion`, to find every constraint (auto-generated ones included), to tell construction curves from profile curves, or to check what a sketch holds, without walking `api.tree()`.

## Result

The result always has all eight arrays, with keys in alphabetical order. On an empty sketch every array is `[]`. Below is the live result for a sketch with an origin rectangle, a free line, a circle, an arcByCenter, an arcBy3Points, a free point, a construction line, circle and arc, 3 manual constraints, an OFFSET and a RADIUS dimension, and a rigid set:

```js
{
  arcs: [99, 104, 122],                  // 122 = construction arc
  circles: [96, 117],                    // 117 = construction circle
  constraints: [62, 68, 74, 80, 82, 84, 86, 88, 90, 115, 120, 135, 137, 139, 143],
  constructionGeometry: [111, 117, 122],
  dimensions: [127, 131],                // CC_2DOffsetConstraint, CC_2DRadiusConstraint
  lines: [58, 64, 70, 76, 92, 111],      // 111 = construction line
  points: [59, 60, 65, /* … */ 125],     // 24
  solidGeometry: [58, 64, 70, 76, 92, 96, 99, 104],
}
```

| key | holds |
|---|---|
| `points` | Every `CC_Point`: free `sketch.point`s plus every curve's start, end and center points, including arc and circle centers and the points of construction curves. `getGeometry().points` holds only the free points. |
| `lines` / `circles` / `arcs` | All curves of that type, construction curves included. Arcs from `arcByCenter` and from `arcBy3Points` both go in `arcs`. |
| `constructionGeometry` | Construction curves. Each id is also in its type list. |
| `solidGeometry` | `lines ∪ circles ∪ arcs` minus construction curves. This only filters by type; it does not check that a profile is closed. |
| `constraints` | All geometric constraints: the rectangle's autos (`Auto_Fix`, `Rect_Coinc`, `Rect_Par`, `Rect_Perp`, `Rect_H`), creation autos (`Auto_H`, `Auto_Coinc`), manual constraints, and rigid sets (`CC_RigidSet`). Dimension constraints are not in this list. |
| `dimensions` | One solver constraint per dimension: OFFSET → `CC_2DOffsetConstraint`, HORIZONTAL_/VERTICAL_DISTANCE → `CC_2DHorizontalDistanceConstraint` / `CC_2DVerticalDistanceConstraint`, RADIUS → `CC_2DRadiusConstraint`, ANGLE → `CC_2DAngleConstraint`, ANGLEOX → `CC_2DAngleOXConstraint`. |

- **Not listed:** sketch regions, and the display dimensions that `sketch.dimension()` returns. Every child of the `CC_Sketch` node is in at least one list.
- **Order:** ascending id, which is creation order. The same call gives the same result each time. A line switched to construction later keeps its id position (`[92, 99]`); it is not appended.
- **Live:** the next call reflects every change. `deleteObject` removes a curve from its lists and its points from `points`. `updateGeometry` with `isConstruction` moves a curve between `solidGeometry` and `constructionGeometry`.
- **Consumed sketches:** after an extrusion, the call works and returns the same lists. Geometry you add to the sketch afterwards appears at once, also in `solidGeometry`, although the extrusion does not use it.

## Traps

- **`dimensions` does not contain the ids that `sketch.dimension()` returns.** `dimension()` returns the display entity (`CC_LinearFeatureDimension`, `CC_RadialFeatureDimension` or `CC_AngularFeatureDimension` under `CC_DimensionSet › CC_SketchDimensionSet`). The list holds that entity's `members.master`. So matching `dimension()` results against `dimensions` finds nothing. `updateDimension` rejects a list id with 1001 `wrong id type! … ["dimension"]`. To get the display id from a list id, search the tree:
  ```js
  const t = await api.tree({ refresh: true })
  const display = Object.values(t).find((n) => /FeatureDimension$/.test(n.class) && n.members?.master?.value === masterId)
  ```
  `deleteObject` accepts either id and removes both the display entity and the constraint.
- **Use `solidGeometry` as extrusion `references` only when the sketch holds exactly one closed profile.** In that case it builds the exact body (plate 80×50, hole r10, height 10: volume 36858.14, analytic 36858.41). If the sketch also has a stray open line, the extrusion fails with 51 `Brep after linear sweep not manifold` and no body is built. With several profiles or stray curves, pick the loop's curve ids yourself.
- **Never pass `lines` + `circles` + `arcs` as references.** A construction curve in the extrusion's `references` gives 51 `Selection of construction geometry is not allowed.`, but the body is built anyway, so the error is misleading. A `sketchRegion` that contains a construction curve is created without any error. Its extrusion then fails: 51 `There is at least one construction curve in the region …`, and no body is built.
- **`constraints` is longer than the list of constraints you created.** It includes autos and rigid sets (`CC_RigidSet` is not a `*Constraint` class). Before acting on all of them, filter by class or name from `api.tree()`.
- **Only a sketch id is accepted.** Curve and region ids fail here; use `getGeometry` to list a region or a rigid set.

## Errors

In scripts, every one of these throws (maxLevel 51).

| code | message | cause |
|---|---|---|
| 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` | part, work plane, curve, point, constraint, dimension (either id) or region id |
| 1006 | `An element of parameter "id" has an invalid id!` + level-41 `ToId()/TOID() didn't get an existing or valid id.` | id that does not exist |
| 1006 | same + level-41 `The string "S" couldn't be converted to an id…` | the sketch's name instead of its id. A numeric string such as `"52"` works. |
| 1001 | `Set the parameter "id" = VOID is not allowed in this situation!` | `id: null`, e.g. the result of a failed create |
| 1004 | `The parameter "id" must be provided in the api call!` | no `id` |

## Working example

```js
const partId = (await api.v1.part.create({ name: 'Plate' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
const hole = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 25, 0], radius: 10 })).result
await api.v1.sketch.line({ id: skId, startPos: [-10, 25, 0], endPos: [90, 25, 0], isConstruction: true })
await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [hole], value: 10, name: 'holeR' })

const L = (await api.v1.sketch.getObjectsLists({ id: skId })).result
// L.solidGeometry = 4 rectangle lines + hole; the construction axis is only in lines + constructionGeometry
await api.v1.part.extrusion({ id: partId, references: L.solidGeometry, limit2: 10 })

// resize the hole through the dimension found in the list
const t = await api.tree({ refresh: true })
const dim = Object.values(t).find((n) => /FeatureDimension$/.test(n.class) && n.members?.master?.value === L.dimensions[0])
await api.v1.sketch.updateDimension({ id: dim.id, value: 12 }) // sketch re-solves at once: r = 12
await api.v1.common.recalc() // the extrusion follows after recalc: volume 35476.65
```

## Related

[getGeometry.md](getGeometry.md) (also takes a region or rigid set id; free points only) · [dimension.md](dimension.md) · [updateDimension.md](updateDimension.md) · [deleteObject.md](deleteObject.md) · [sketchRegion.md](sketchRegion.md) · [constraint.md](constraint.md) · `sketch.getObjectInfo` (per object: `isConstruction`, its constraints) · [STRUCTURE.md](../STRUCTURE.md) (sketch anatomy)
