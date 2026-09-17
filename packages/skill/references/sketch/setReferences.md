# sketch.setReferences

Sets a sketch's plane, axis, and origin references — where it sits in 3D and how its local coordinate system is oriented. All references accept brep geometry or work geometry.

## Key Parameters

All optional except `id`; set any combination.

- **`id`** — sketch ID
- **`planeId`** — face or work plane
- **`invertPlane`** (default FALSE) — inverts the plane normal
- **`axisId`** — brep edge or work axis; controls X-axis direction
- **`isXAxis`** (default TRUE) — TRUE: `axisId` is the X-axis. FALSE: `axisId` is a direction and X = normal × direction.
- **`invertAxis`** (default FALSE) — inverts the axis
- **`originId`** — brep vertex or work point; sets the origin (shifts coordinates)

## Return Value

VOID (null), maxLevel=31 on success.

## Behavior

- **Fixes sketches for `referenceGeometry`.** Sketches created without `planeId` fail with `referenceGeometry`; setting `planeId` here adds the needed reference retroactively.
- **Face vs work plane.** A face re-maps geometry to the face plane (world positions from `getPositions` shift, e.g. to a face at a different z). A work plane updates the internal reference, but `getPositions` (world coordinates) may show no change.
- **Axis rotation.** A 45° axis at [1,1,0] rotates all local coordinates accordingly.
- Repeated calls overwrite previous references — no accumulation.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', position: [0, 0, 20], normal: [0, 0, 1] })).result
const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', position: [0, 0, 0], direction: [1, 1, 0] })).result

// Sketch without planeId (default XY) — plane reference added retroactively
const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
await api.v1.sketch.setReferences({ id: skId, planeId: wpId, axisId: waId, isXAxis: 1 })
```

## Related

`sketch.create` · `sketch.referenceGeometry` · `sketch.setWorkPlane`
