# sketch.setReferences

Sets the plane, axis, and origin references for a sketch. Controls where the sketch sits in 3D space and how its local coordinate system is oriented.

## Prerequisites

- A sketch (from `sketch.create`)
- Optional: work planes, work axes, work points, brep faces/edges/vertices for references

## Key Parameters

- **`id`** (required) — sketch ID
- **`planeId`** (optional) — face ID or work plane ID. Sets which plane the sketch lies on.
- **`invertPlane`** (optional, default FALSE) — inverts the plane normal direction
- **`axisId`** (optional) — line (brep edge) or work axis ID. Controls the sketch's X-axis direction.
- **`isXAxis`** (optional, default TRUE) — if TRUE, `axisId` defines the X-axis. If FALSE, `axisId` defines a direction and the X-axis is computed as the cross-product of the normal and that direction.
- **`invertAxis`** (optional, default FALSE) — inverts the axis direction
- **`originId`** (optional) — point (brep vertex) or work point ID. Sets the sketch's origin.

## Return Value

```js
{ result: VOID, messages?: [...], maxLevel?: real }
```

Returns VOID (null). maxLevel=31 on success.

## Behavior

- **Can fix sketches for `referenceGeometry`.** Sketches created without `planeId` fail with `referenceGeometry`. Calling `setReferences` with a `planeId` retroactively adds the needed reference.
- **Face vs work plane effects differ.** Setting `planeId` to a face re-maps sketch geometry to the face plane (positions change in world coordinates). Setting to a work plane changes the internal reference but positions may not change visibly via `getPositions`.
- **Axis rotation.** Setting `axisId` rotates the sketch's local coordinate system. A 45-degree axis at [1,1,0] rotates all coordinates accordingly.
- **Origin shift.** Setting `originId` moves the sketch's origin reference, shifting coordinates.
- **Accepts both brep geometry and work geometry** as references (faces, edges, vertices, work planes, axes, points).
- **All parameters are optional.** You can set just the plane, just the axis, or any combination.

## Gotchas

- `getPositions` returns world coordinates. After `setReferences` with a work plane, reported positions may not visually change even though the internal coordinate system reference has been updated. After setting to a face at a different z-level, positions DO shift.
- Multiple `setReferences` calls overwrite previous references — there's no accumulation.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
const wpId = (await api.v1.part.workPlane({
  id: partId, name: 'WP1',
  origin: [0, 0, 20], normal: [0, 0, 1], xDirection: [1, 0, 0]
})).result

// Create sketch without planeId (default XY)
const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

// Retroactively set the plane reference — now referenceGeometry will work
await api.v1.sketch.setReferences({ id: skId, planeId: wpId })

// Can also set axis and origin
const waId = (await api.v1.part.workAxis({
  id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 1, 0]
})).result
await api.v1.sketch.setReferences({ id: skId, planeId: wpId, axisId: waId, isXAxis: 1 })
```

## Related

- `sketch.create` — `planeId` parameter sets the initial plane reference at creation time
- `sketch.referenceGeometry` — requires a plane reference to work (setReferences can provide this)
- `sketch.setWorkPlane` — alternative way to position a sketch
