# part.sketch

Creates a sketch in a part. **Identical alias of `sketch.create`** — same parameters, behavior, and return value.

## Key Parameters

- **`id`** (required) — part ID; other ID types → error 1001
- **`planeId`** (optional) — accepted types: `workplane`, `face-plane` (anything else → 1001, not 1006, even for a part or sketch ID):
  - Work plane ID → sketch placed directly on it
  - Face ID → auto-creates a work plane on that face
  - Omitted → default XY plane at origin
- **`name`** (optional, default `"Sketch"`) — no validation: empty strings, 200+ chars, `/()` all accepted silently

## Return Value

`{ result: sketchId, messages: [], maxLevel: 31 }` — the `CC_Sketch` node ID.

## What Gets Created

Each call creates 3 objects consuming ~6 ID slots: `CC_Sketch` (returned ID), `CC_SketchReference` (reference geometry), `CC_SketchDimensionSet` (dimensions). Consecutive sketches' IDs increment by 6 (e.g. 52, 58, 64, 70, 76).

## Gotchas

- **Duplicate names are silent** (no uniqueness check). `part.getSketch` returns only the **first** match — later duplicates are unreachable by name.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | `id` omitted |
| "invalid id" | 1006 | Non-existent ID |
| "wrong id type — provide only: ['part']" | 1001 | ID exists but is not a part |
| "wrong id type — provide only: ['workplane', 'face-plane']" | 1001 | `planeId` not a work plane or face |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

const sk1 = (await api.v1.part.sketch({ id: partId })).result // default XY, default name

const wpId = (await api.v1.part.workPlane({ id: partId, normal: [0, 0, 1], position: [0, 0, 50] })).result
const sk2 = (await api.v1.part.sketch({ id: partId, planeId: wpId, name: 'TopSketch' })).result

// On a solid face: top face of a 100×80×60 box, found by position
await api.v1.part.box({ id: partId, length: 100, width: 80, height: 60 })
const faceId = (await api.v1.part.getGeometryIds({ id: partId, planes: [{ positions: [[50, 40, 60]] }] })).result.planes[0]
const sk3 = (await api.v1.part.sketch({ id: partId, planeId: faceId, name: 'FaceSketch' })).result
```

## Related

`sketch.create` · `part.getSketch` · `sketch.deleteSketch` · `sketch.setWorkPlane` · `part.workPlane`
