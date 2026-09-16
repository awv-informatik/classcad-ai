# part.workCSys

Creates a work coordinate system feature — a local reference frame defined by origin, orientation, and optional offset/rotation.

## Prerequisites

- A part (`part.create`)
- For XYAXISORIGIN type: 3 references (origin point + 2 axis directions) from `part.getGeometryIds` or work geometry

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — feature name, default `"WorkCSys"`. Duplicate names allowed, `getWorkGeometry` returns first match.
- **`type`** — one of 2 types (default `"CUSTOM"`):

| Type | References needed | Description |
|------|------------------|-------------|
| `CUSTOM` | none | CSys at global origin with global XY directions. Use offset/rotation to reposition. |
| `XYAXISORIGIN` | exactly 3 | Origin point + first axis + second axis define the frame. Accepts brep vertices/edges and work points/axes. |

- **`references`** — array of exactly 3 IDs for XYAXISORIGIN: `[originPoint, axis1, axis2]`. Not needed for CUSTOM.
- **`offset`** — `[x,y,z]` translation vector. Default `[0,0,0]`. Works on both types — applies on top of referenced frame for XYAXISORIGIN. For expressions, pass the whole vector as one string: `offset: '[0, 0, @expr.H]'` (live — the csys follows expression updates).
- **`rotation`** — `[rx,ry,rz]` Euler angles in radians. Default `[0,0,0]`. Compound rotations work. Applies on top of referenced frame for XYAXISORIGIN.
- **There is no `origin`, `xDirection` or `yDirection` parameter.** Those keys are ignored without a message, leaving the csys at the part origin with global axes. Position with `offset`, orient with `rotation` (or use XYAXISORIGIN).
- **`inverted`** — boolean, default `false`. Mirrors the X-axis of the coordinate system.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the feature ID of the created work coordinate system.

## Built-in Work CSys

Parts have **no** built-in work coordinate system. The built-in `Origin` is a work **point** (`CC_WorkPoint`): it works as a point reference (e.g. `workAxis` type `2POINTS`, XYAXISORIGIN origin) but is rejected wherever a csys is required (`references` of primitives, assembly mates: `wrong id type ... ["workcsys"]`). For a csys at the part origin, create `part.workCSys({ id, name })`.

## Gotchas

- **Expressions go in a string-encoded vector, not in array elements.** `offset: '[0, 0, @expr.H]'` works and stays live; `offset: [0, 0, '@expr.H']` fails with a type error.
- **Assembly constraints need an explicit workCSys.** The built-in `Origin` is a work point, so it is rejected as a mate `csys` (`wrong id type ... ["workcsys"]`); create `part.workCSys({ id, name })` for a csys at the part origin.
- **In assemblies the csys is the mounting frame.** Constraints place instances by their csys (see `assembly/fastened.md`), so where the csys sits determines where parts meet.
- **XYAXISORIGIN requires exactly 3 references** — `[origin, axis1, axis2]`. 2 refs → error. The order matters: point first, then two axis directions.
- **Duplicate names are silently allowed** — `getWorkGeometry` returns first match only.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type string | Use `"CUSTOM"` or `"XYAXISORIGIN"` |
| `"references" must be provided` | XYAXISORIGIN without refs | Pass `references: [origin, axis1, axis2]` |
| `"references" has invalid number of elements` | Wrong count | Must be exactly 3 for XYAXISORIGIN |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Simple CUSTOM: offset + rotated 45° around Z
const csId = (await api.v1.part.workCSys({
  id: partId,
  name: 'CS_custom',
  offset: [50, 30, 20],
  rotation: [0, 0, Math.PI / 4]
})).result

// Csys at the part origin (the built-in 'Origin' is a work point, not a csys)
const originCS = (await api.v1.part.workCSys({ id: partId, name: 'OriginCS' })).result

// XYAXISORIGIN from work geometry
const wpId = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [40, 30, 20] })).result
const xAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

const csRef = (await api.v1.part.workCSys({
  id: partId,
  name: 'CS_referenced',
  type: 'XYAXISORIGIN',
  references: [wpId, xAxis, yAxis],
  offset: [10, 0, 0]  // additional offset on top of referenced frame
})).result

// Inverted CSys (X-axis mirrored)
const csInv = (await api.v1.part.workCSys({
  id: partId,
  name: 'CS_inverted',
  inverted: true
})).result
```

## Related

`part.updateWorkCSys` · `part.getWorkGeometry` · `part.workPlane`
