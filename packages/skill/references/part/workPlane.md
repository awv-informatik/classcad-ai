# part.workPlane

Creates a work plane feature — an invisible construction reference used as a sketch parent, mirror plane, or positioning aid.

## Prerequisites

- A part (`part.create`)
- For referenced types (PLANE, EDGEPOINT, etc.): brep geometry IDs from `part.getGeometryIds` or work geometry IDs

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — feature name, default `"WorkPlane"`. Duplicate names are allowed but `getWorkGeometry` only returns the first match. Use unique names.
- **`type`** — one of 7 types (default `"USERDEFINED"`):

| Type | References needed | Description |
|------|------------------|-------------|
| `USERDEFINED` | none | Free-standing plane defined by `normal`, `position`, `offset` |
| `PLANE` | 1 face or work plane | Copies a reference plane. `offset` shifts along normal |
| `EDGEPOINT` | 1 edge/axis + 1 point | Edge + point define the plane |
| `3POINTS` | 3 points | Three points define the plane |
| `POINTNORMAL` | 1 point + 1 edge/axis | Point sets position, edge/axis direction becomes the normal |
| `POINTFACE` | 1 point + 1 face/plane | Point sets position, face normal becomes the plane normal |
| `LINEPLANEANGLE` | 1 edge/axis + 1 face/plane | Line midpoint = position, plane = initial orientation, `angle` rotates around the line |

- **`references`** — array of brep or work geometry IDs. Not needed for USERDEFINED. Order matters: point-type refs first, direction/face refs second (for POINTNORMAL, POINTFACE).
- **`normal`** — `[x,y,z]` vector, USERDEFINED only. Default `[1,0,0]` (YZ plane, **not** XY despite some doc headers).
- **`position`** — `[x,y,z]` center point, USERDEFINED only. Default `[0,0,0]`.
- **`offset`** — distance along normal. Works on all types. Default `0`.
- **`angle`** — radians or expression string, LINEPLANEANGLE only. Accepts `Math.PI/4` or `'45deg'`.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the feature ID of the created work plane. Use this ID as:
- `plane` param in `sketch.create` — sketch on this plane
- `references` element in `part.mirror` — mirror across this plane
- Reference for other work geometry or features

## Gotchas

- **Default normal is [1,0,0] (YZ plane)**, not XY. To get an XY plane, pass `normal: [0,0,1]`.
- **Duplicate names are silently allowed** — no error, no warning. `getWorkGeometry` returns only the first match. Always use unique names.
- **Collinear points create a broken feature** — `3POINTS` with collinear points returns an ID but sets maxLevel=51. Always check `maxLevel` after creation.
- **Wrong reference types create broken features** — e.g., LINEPLANEANGLE with two faces instead of line+face creates a feature but it's invalid (maxLevel=51 with internal error).
- **`getGeometryIds` is position-based** — it doesn't dump all IDs. You must query by approximate position. For a box at origin (L×W×H): top face at `[[L/2, W/2, H]]`, vertices at exact corner coordinates.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type string | Use exact string from enum |
| `"references" must be provided` | Non-USERDEFINED type without refs | Pass `references: [...]` |
| `"references" has invalid number of elements` | Wrong count (e.g., 2 for 3POINTS) | Match the required count for the type |
| `maxLevel: 51` after success | Collinear points or wrong ref types | Check geometry validity before creation |

## Built-in Work Planes

Every part has 3 built-in work planes (created automatically by `part.create`):

| Name | Normal | Description |
|------|--------|-------------|
| `Top` | `[0,0,1]` | XY plane |
| `Front` | `[0,1,0]` | XZ plane |
| `Right` | `[1,0,0]` | YZ plane |

Access them via `getWorkGeometry({ id: partId, name: 'Top' })`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Simple USERDEFINED: XY plane at z=50
const wpId = (await api.v1.part.workPlane({
  id: partId,
  name: 'WP_top50',
  normal: [0, 0, 1],
  offset: 50
})).result

// Sketch on the work plane
const skId = (await api.v1.sketch.create({ id: partId, plane: wpId })).result

// Referenced: offset from a brep face
const topFace = (await api.v1.part.getGeometryIds({
  id: partId,
  planes: [{ positions: [[40, 30, 40]] }]
})).result.planes[0]

const wp2 = (await api.v1.part.workPlane({
  id: partId,
  name: 'WP_above_top',
  type: 'PLANE',
  references: [topFace],
  offset: 20
})).result

// Angled plane: LINEPLANEANGLE with expression angle
const edgeId = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 0] }]
})).result.lines[0]

const wp3 = (await api.v1.part.workPlane({
  id: partId,
  name: 'WP_angled',
  type: 'LINEPLANEANGLE',
  references: [edgeId, topFace],
  angle: '45deg'
})).result
```

## Related

- `part.updateWorkPlane` — modify after creation (name, type, refs, offset, angle, position, normal)
- `part.getWorkGeometry` — find work plane by name
- `sketch.create` — create sketch on a work plane (pass wp ID as `plane` param)
- `part.mirror` — mirror geometry across a work plane
- `part.workAxis`, `part.workPoint`, `part.workCSys` — other work geometry types
