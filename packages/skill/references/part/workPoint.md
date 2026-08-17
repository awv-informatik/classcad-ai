# part.workPoint

Creates a work point feature — an invisible construction point used as a reference for patterns, coordinate systems, or positioning.

## Prerequisites

- A part (`part.create`)
- For referenced types: brep geometry IDs from `part.getGeometryIds` or sketch geometry IDs

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — feature name, default `"WorkPoint"`. Duplicate names allowed.
- **`type`** — one of 8 types (default `"USERDEFINED"`):

| Type | Refs needed | Description | Valid ref types |
|------|-------------|-------------|-----------------|
| `USERDEFINED` | none | Free-standing point at `position` | — |
| `BREPVERTEX` | 1 | Point at a vertex position | sketch-point, vertex |
| `EDGEMIDPOINT` | 1 | Midpoint of an edge | brep-edge, sketch-line |
| `CENTER` | 1 | Center of a circle/arc | sketch-circle, sketch-arc, edge-arc, edge-circle |
| `BARYCENTER` | 1 | Center of a face | face-plane only (**not** work planes) |
| `INTERSECTION` | 2 | Intersection of 2 curves | brep-edge, sketch-line |
| `INNERCIRCLE` | 3 | Incircle center of 3 curves | brep-edge, sketch-line |
| `2POINTS` | 2 | Midpoint between 2 points | brep-vertex, sketch-point |

- **`references`** — array of geometry IDs. Not needed for USERDEFINED.
- **`position`** — `[x,y,z]` numeric array, USERDEFINED only. Default `[0,0,0]`. **Numbers only, no expressions.**

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the feature ID. Use this ID as:
- `references` element in `part.workAxis` (POINTDIRECTION, 2POINTS types)
- `references` element in `part.workCSys` (XYAXISORIGIN origin)
- `references` element in `part.linearPattern` (direction via 2 work points)

## Gotchas

- **BREPVERTEX rejects work point IDs** — only sketch-point and vertex types. Despite being called "BREPVERTEX", sketch points are valid.
- **BARYCENTER rejects work plane IDs** — only face-plane (brep faces). The docs say "brep-face or work-plane" but work plane IDs are rejected with "wrong id type".
- **2POINTS with same point twice succeeds** — unlike workAxis.2POINTS which errors "null vector", workPoint.2POINTS returns the point itself (midpoint = same point). No error.
- **Expression strings in position fail** — numbers only, same as all work geometry.
- **No built-in work points** — unlike work planes (Top/Front/Right), work axes (XAxis/YAxis/ZAxis), and work CSys (Origin), parts have no built-in work points.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type | Use exact string from 8 valid types |
| `"references" must be provided` | Non-USERDEFINED without refs | Pass `references: [...]` |
| `"references" has a wrong id type` | Wrong geometry type for the workPoint type | Check the valid ref types table above |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Simple USERDEFINED
const wpId = (await api.v1.part.workPoint({
  id: partId,
  name: 'WP_center',
  position: [40, 30, 20]
})).result

// BREPVERTEX — snap to a box corner
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const gids = await api.v1.part.getGeometryIds({
  id: partId,
  points: [{ pos: [0, 0, 0] }]
})
const wp2 = (await api.v1.part.workPoint({
  id: partId,
  name: 'WP_corner',
  type: 'BREPVERTEX',
  references: [gids.result.points[0]]
})).result

// BARYCENTER — center of top face
const faceGids = await api.v1.part.getGeometryIds({
  id: partId,
  planes: [{ positions: [[40, 30, 40]] }]
})
const wp3 = (await api.v1.part.workPoint({
  id: partId,
  name: 'WP_faceCenter',
  type: 'BARYCENTER',
  references: [faceGids.result.planes[0]]
})).result

// CENTER — center of sketch circle
const skId = (await api.v1.sketch.create({ id: partId })).result
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 20 })).result
const wp4 = (await api.v1.part.workPoint({
  id: partId,
  name: 'WP_circleCenter',
  type: 'CENTER',
  references: [circId]
})).result
```

## Related

- `part.updateWorkPoint` — modify after creation (requires openFeature/closeFeature)
- `part.getWorkGeometry` — find work point by name
- `part.workAxis` — uses work points as POINTDIRECTION/2POINTS references
- `part.workCSys` — uses work points as XYAXISORIGIN origin
