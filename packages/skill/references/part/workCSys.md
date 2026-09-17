# part.workCSys

Creates a work coordinate system feature — a local reference frame defined by origin, orientation, and optional offset/rotation.

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — default `"WorkCSys"`. Duplicates silently allowed; `getWorkGeometry` returns the first match.
- **`type`** — default `"CUSTOM"`:

| Type | References needed | Description |
|------|------------------|-------------|
| `CUSTOM` | none | At global origin with global XY directions. Reposition with offset/rotation. |
| `XYAXISORIGIN` | exactly 3 | `[originPoint, axis1, axis2]` — order matters (point first). Accepts brep vertices/edges and work points/axes (from `part.getGeometryIds` or work geometry). 2 refs → error. |

- **`offset`** — `[x,y,z]`, default `[0,0,0]`. Both types (applied on top of the referenced frame for XYAXISORIGIN). Expressions: whole vector as one string, `offset: '[0, 0, @expr.H]'` (live — follows expression updates); `[0, 0, '@expr.H']` fails with a type error.
- **`rotation`** — `[rx,ry,rz]` Euler angles in radians, default `[0,0,0]`. Compound rotations work; applied on top of the referenced frame for XYAXISORIGIN.
- **`inverted`** — boolean, default `false`. Mirrors the X-axis.
- **There is no `origin`, `xDirection` or `yDirection` parameter.** Those keys are ignored without a message, leaving the csys at the part origin with global axes. Position with `offset`, orient with `rotation` (or use XYAXISORIGIN).

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Feature ID of the work coordinate system.

## No Built-in Work CSys

Parts have **no** built-in csys. The built-in `Origin` is a work **point** (`CC_WorkPoint`): valid as a point reference (e.g. `workAxis` `2POINTS`, XYAXISORIGIN origin) but rejected wherever a csys is required (`references` of primitives, assembly mates: `wrong id type ... ["workcsys"]`). For a csys at the part origin, create `part.workCSys({ id, name })` — assembly constraints need one explicitly.

## Gotchas

- **In assemblies the csys is the mounting frame.** Constraints place instances by their csys (see `assembly/fastened.md`), so where the csys sits determines where parts meet.

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

// CUSTOM: offset + 45° around Z
const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS_custom', offset: [50, 30, 20], rotation: [0, 0, Math.PI / 4] })).result

// Csys at the part origin (the built-in 'Origin' is a work point, not a csys)
const originCS = (await api.v1.part.workCSys({ id: partId, name: 'OriginCS' })).result

// XYAXISORIGIN from work geometry, plus extra offset
const wpId = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [40, 30, 20] })).result
const xAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
const csRef = (await api.v1.part.workCSys({
  id: partId, name: 'CS_referenced', type: 'XYAXISORIGIN',
  references: [wpId, xAxis, yAxis], offset: [10, 0, 0],
})).result

// Inverted (X-axis mirrored)
const csInv = (await api.v1.part.workCSys({ id: partId, name: 'CS_inverted', inverted: true })).result
```

## Related

`part.updateWorkCSys` · `part.getWorkGeometry` · `part.workPlane`
