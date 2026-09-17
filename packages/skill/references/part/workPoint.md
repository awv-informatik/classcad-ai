# part.workPoint

Creates a work point feature — an invisible construction point used as a reference for patterns, coordinate systems, or positioning.

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — default `"WorkPoint"`. Duplicates allowed.
- **`type`** — default `"USERDEFINED"`:

| Type | Refs needed | Description | Valid ref types |
|------|-------------|-------------|-----------------|
| `USERDEFINED` | none | Free-standing point at `position` | — |
| `BREPVERTEX` | 1 | Point at a vertex position | sketch-point, vertex (**not** work points) |
| `EDGEMIDPOINT` | 1 | Midpoint of an edge | brep-edge, sketch-line |
| `CENTER` | 1 | Center of a circle/arc | sketch-circle, sketch-arc, edge-arc, edge-circle |
| `BARYCENTER` | 1 | Center of a face | face-plane only (**not** work planes — rejected with "wrong id type" despite the docs) |
| `INTERSECTION` | 2 | Intersection of 2 curves | brep-edge, sketch-line |
| `INNERCIRCLE` | 3 | Incircle center of 3 curves | brep-edge, sketch-line |
| `2POINTS` | 2 | Midpoint between 2 points | brep-vertex, sketch-point |

- **`references`** — geometry IDs (from `part.getGeometryIds` or sketch geometry). Not needed for USERDEFINED.
- **`position`** — `[x,y,z]`, USERDEFINED only. Default `[0,0,0]`. Expressions: whole vector as one string, `'[@expr.X, 0, 0]'` (live — follows `updateExpression`; same for all work geometry vectors). `['@expr.X', 0, 0]` fails with a type error.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Feature ID. Use as `references` in `part.workAxis` (POINTDIRECTION, 2POINTS), `part.workCSys` (XYAXISORIGIN origin), `part.linearPattern` (direction via 2 work points).

## Gotchas

- **2POINTS with the same point twice succeeds** — returns that point (midpoint = same point), no error; unlike workAxis `2POINTS`, which errors "null vector".
- **One built-in work point: `Origin`** at [0,0,0] (`getWorkGeometry({ id, name: 'Origin' })`). Parts also have built-in planes (Top/Front/Right) and axes (XAxis/YAxis/ZAxis), but no built-in work csys.

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

// USERDEFINED
const wpId = (await api.v1.part.workPoint({ id: partId, name: 'WP_center', position: [40, 30, 20] })).result

// BREPVERTEX — box corner; BARYCENTER — top face center
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const gids = (await api.v1.part.getGeometryIds({
  id: partId, points: [{ pos: [0, 0, 0] }], planes: [{ positions: [[40, 30, 40]] }],
})).result
const wp2 = (await api.v1.part.workPoint({ id: partId, name: 'WP_corner', type: 'BREPVERTEX', references: [gids.points[0]] })).result
const wp3 = (await api.v1.part.workPoint({ id: partId, name: 'WP_faceCenter', type: 'BARYCENTER', references: [gids.planes[0]] })).result

// CENTER — sketch circle center
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 20 })).result
const wp4 = (await api.v1.part.workPoint({ id: partId, name: 'WP_circleCenter', type: 'CENTER', references: [circId] })).result
```

## Related

`part.updateWorkPoint` · `part.getWorkGeometry` · `part.workAxis` · `part.workCSys`
