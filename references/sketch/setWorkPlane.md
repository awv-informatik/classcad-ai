# sketch.setWorkPlane

Reassigns a sketch to a different work plane after creation. Updates the sketch's coordinate system to match the target plane.

## Prerequisites

- An existing sketch (`sketch.create`)
- A work plane ID (`part.workPlane` or a standard work plane)

## Key Parameters

- **`id`** (required) — sketch ID
- **`planeId`** (required) — work plane ID. **Must be a work plane** — face IDs, sketch IDs, and part IDs are all rejected with error 1001.

## Return Value

```js
{ result: null (VOID), messages?: [...], maxLevel?: real }
```

Returns VOID on success. maxLevel=31.

## What It Does

1. Updates `planeReference` member to point to the new work plane ID
2. Updates `coordinateSystem` — origin moves to the plane's position, axes rotate to match the plane's orientation
3. Preserves all sketch geometry — local coordinates unchanged, world-space position changes with the plane

## Gotchas

- **Only accepts work plane IDs.** Unlike `sketch.create` which accepts both work planes and faces, `setWorkPlane` only accepts work plane type IDs.
- **To move a sketch to a face:** first create a work plane on that face with `part.workPlane`, then pass the work plane ID to `setWorkPlane`.
- **Origin accumulates across reassignments.** When moving a sketch between planes, the origin preserves components orthogonal to the new plane's normal. Example: sketch on plane A (pos=[0,50,0]) moved to plane B (pos=[20,0,0]) → origin becomes `[20,50,0]`, not `[20,0,0]`. A fresh sketch created directly on plane B would get `[20,0,0]`. If you need a clean origin, create a new sketch on the target plane instead of moving an existing one.
- **Cannot restore planeReference=0.** The implicit default (XY plane, planeReference=0) cannot be restored via setWorkPlane. Moving back to XY requires creating an explicit XY work plane, and planeReference will point to that plane's ID, not 0.
- **Idempotent.** Setting setWorkPlane to the plane the sketch is already on: no change, maxLevel=31.
- **Works with all work plane types:** USERDEFINED, PLANE-referenced (with offset), standard planes (Top/Front/Right), tilted/non-axis-aligned planes.
- **Standard work planes** exist on every part: Top (XY), Front (XZ), Right (YZ). Use them directly with setWorkPlane.

## Standard Work Plane Coordinate Systems

After assigning a sketch to a standard plane:

| Plane | X-axis | Y-axis | Z-axis (normal) |
|-------|--------|--------|-----------------|
| Top (XY) | `[1,0,0]` | `[0,1,0]` | `[0,0,1]` |
| Front (XZ) | `[1,0,0]` | `[0,0,-1]` | `[0,1,0]` |
| Right (YZ) | `[0,1,0]` | `[0,0,1]` | `[1,0,0]` |

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "wrong id type" — only workplane accepted | 1001 | planeId is not a work plane (face, sketch, part) |
| "didn't get an existing or valid id" | 1006 | Non-existent planeId or invalid sketch ID |
| "planeId must be provided" | 1004 | Missing planeId parameter |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create a work plane on XZ at y=50
const wpId = (await api.v1.part.workPlane({
  id: partId,
  normal: [0, 1, 0],
  position: [0, 50, 0],
})).result

// Reassign the sketch
await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
// planeReference is now wpId, coordinateSystem origin at [0,50,0]
```

### Using standard work planes

```js
// Parts come with Top(38), Front(42), Right(46) — find them:
const partR = await api.v1.part.create({})
const tree = partR.structure?.tree || {}
const stdPlanes = Object.values(tree).filter(n => n.class === 'CC_WorkPlane')
// stdPlanes → [{id:38, name:'Top'}, {id:42, name:'Front'}, {id:46, name:'Right'}]

// Move sketch to Front plane
await api.v1.sketch.setWorkPlane({ id: skId, planeId: 42 })
```

## Related

- `sketch.create` — initial sketch placement (accepts faces too, unlike setWorkPlane)
- `part.workPlane` — create the target work plane
- `part.updateWorkPlane` — modify a work plane's position/normal after creation
