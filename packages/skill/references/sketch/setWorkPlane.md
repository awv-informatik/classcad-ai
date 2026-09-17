# sketch.setWorkPlane

Reassigns an existing sketch to a different work plane.

## Key Parameters

- **`id`** (required) — sketch ID
- **`planeId`** (required) — **work plane only** (unlike `sketch.create`): face, sketch, part IDs → 1001. For a face, first create a work plane on it with `part.workPlane`. All work plane types work: USERDEFINED, PLANE-referenced (with offset), standard Top/Front/Right, tilted.

## Return Value

VOID, maxLevel 31.

## Behavior

1. `planeReference` → new work plane ID
2. `coordinateSystem` origin moves to the plane position, axes rotate to its orientation
3. Geometry keeps local coordinates; world position follows the plane

Setting the current plane again: no change, maxLevel 31.

## Gotchas

- **Origin accumulates across reassignments** — components orthogonal to the new normal are kept: plane A (pos [0,50,0]) → plane B (pos [20,0,0]) gives origin `[20,50,0]`, while a fresh sketch on B gets `[20,0,0]`. For a clean origin, create a new sketch on the target plane.
- **Cannot restore `planeReference=0`** (implicit default XY). Moving back needs an explicit XY work plane, and planeReference points to that ID.

## Standard Work Planes

Every part has them (Top=38, Front=42, Right=46 on a fresh part; `part.getWorkGeometry({ id, name })`). Coordinate systems after assignment:

| Plane | X-axis | Y-axis | Z-axis (normal) |
|-------|--------|--------|-----------------|
| Top (XY) | `[1,0,0]` | `[0,1,0]` | `[0,0,1]` |
| Front (XZ) | `[1,0,0]` | `[0,0,-1]` | `[0,1,0]` |
| Right (YZ) | `[0,1,0]` | `[0,0,1]` | `[1,0,0]` |

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "wrong id type" — only workplane accepted | 1001 | planeId is face/sketch/part |
| "didn't get an existing or valid id" | 1006 | Nonexistent planeId or sketch ID |
| "planeId must be provided" | 1004 | Missing planeId |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// XZ work plane at y=50
const wpId = (await api.v1.part.workPlane({ id: partId, normal: [0, 1, 0], position: [0, 50, 0] })).result
await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId }) // origin [0,50,0]

const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
await api.v1.sketch.setWorkPlane({ id: skId, planeId: frontId })
```

## Related

`sketch.create` · `part.workPlane` · `part.updateWorkPlane`
