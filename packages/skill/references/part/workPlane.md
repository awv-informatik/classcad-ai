# part.workPlane

Creates a work plane feature — an invisible construction reference used as a sketch parent, mirror plane, or positioning aid.

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — default `"WorkPlane"`. Duplicates silently allowed (no error/warning), but `getWorkGeometry` returns only the first match — use unique names.
- **`type`** — default `"USERDEFINED"`:

| Type | References needed | Description |
|------|------------------|-------------|
| `USERDEFINED` | none | Free-standing plane from `normal`, `position`, `offset` |
| `PLANE` | 1 face or work plane | Copies a reference plane. `offset` shifts along normal |
| `EDGEPOINT` | 1 edge/axis + 1 point | Edge + point define the plane |
| `3POINTS` | 3 points | Three points define the plane |
| `POINTNORMAL` | 1 point + 1 edge/axis | Point = position, edge/axis direction = normal |
| `POINTFACE` | 1 point + 1 face/plane | Point = position, face normal = plane normal |
| `LINEPLANEANGLE` | 1 edge/axis + 1 face/plane | Line midpoint = position, plane = initial orientation, `angle` rotates around the line |

- **`references`** — brep or work geometry IDs (from `part.getGeometryIds` or work geometry). Not needed for USERDEFINED. Order matters: point refs first, direction/face refs second (POINTNORMAL, POINTFACE).
- **`normal`** — `[x,y,z]`, USERDEFINED only. Default `[1,0,0]` (**YZ plane, not XY** despite some doc headers — for XY pass `[0,0,1]`).
- **`position`** — `[x,y,z]` center, USERDEFINED only. Default `[0,0,0]`. The key is `position` — `origin` (and `xDirection`) are ignored without a message, leaving the plane at `[0,0,0]`.
- **`offset`** — distance along normal, all types. Default `0`.
- **`angle`** — LINEPLANEANGLE only; radians (`Math.PI/4`) or expression string (`'45deg'`).

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Feature ID. Use as `planeId` in `sketch.create`, `references` in `part.mirror`, or a reference for other work geometry/features.

## Built-in Work Planes

Every part has `Top` `[0,0,1]` (XY), `Front` `[0,1,0]` (XZ), `Right` `[1,0,0]` (YZ) — get via `getWorkGeometry({ id: partId, name: 'Top' })`.

## Gotchas

- **Broken features still return an ID — check `maxLevel`.** `3POINTS` with collinear points, or wrong ref types (e.g. LINEPLANEANGLE with two faces instead of line+face), create the feature with maxLevel=51 (internal error).
- **`getGeometryIds` is position-based** — it doesn't dump all IDs; query by approximate position. Box at origin (L×W×H): top face `[[L/2, W/2, H]]`, vertices at exact corner coordinates.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type string | Use exact string from enum |
| `"references" must be provided` | Non-USERDEFINED type without refs | Pass `references: [...]` |
| `"references" has invalid number of elements` | Wrong count (e.g., 2 for 3POINTS) | Match the required count for the type |
| `maxLevel: 51` after success | Collinear points or wrong ref types | Check geometry validity before creation |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// USERDEFINED: XY plane at z=50, sketch on it
const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP_top50', normal: [0, 0, 1], offset: 50 })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: wpId })).result

// PLANE: 20 above the top face of an 80×60×40 box
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const topFace = (await api.v1.part.getGeometryIds({ id: partId, planes: [{ positions: [[40, 30, 40]] }] })).result.planes[0]
const wp2 = (await api.v1.part.workPlane({ id: partId, name: 'WP_above_top', type: 'PLANE', references: [topFace], offset: 20 })).result

// LINEPLANEANGLE with expression angle
const edgeId = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }] })).result.lines[0]
const wp3 = (await api.v1.part.workPlane({
  id: partId, name: 'WP_angled', type: 'LINEPLANEANGLE', references: [edgeId, topFace], angle: '45deg',
})).result
```

## Related

`part.updateWorkPlane` · `part.getWorkGeometry` · `sketch.create` · `part.mirror` · `part.workAxis`
