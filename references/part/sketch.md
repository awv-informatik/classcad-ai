# part.sketch

Creates a new sketch inside a part. **Identical alias of `sketch.create`** — same parameters, same behavior, same return value. Use whichever namespace you prefer.

## Prerequisites

- A part (`part.create`)
- Optional: a work plane ID (`part.workPlane`) or face ID from solid geometry

## Key Parameters

- **`id`** (required) — part ID. Must be a part — passing other ID types gives error 1001.
- **`planeId`** (optional) — where to place the sketch:
  - **Work plane ID** → sketch placed directly on that plane
  - **Face ID** (from solid geometry) → auto-creates a work plane on that face
  - **Omitted** → default XY plane at origin
  - Accepted types per error message: `workplane`, `face-plane`. Anything else gives error 1001.
- **`name`** (optional, default `"Sketch"`) — very permissive: empty strings, 200+ chars, special characters like `/()` all accepted without error or warning.

## Return Value

```js
{ result: id, messages: [], maxLevel: 31 }
```

Returns the sketch ID (`CC_Sketch` node). maxLevel=31 on success. Empty messages array.

## What Gets Created

Each call creates **3 internal objects** consuming ~6 ID slots:
- `CC_Sketch` — the sketch itself (the returned ID)
- `CC_SketchReference` — reference geometry container
- `CC_SketchDimensionSet` — dimension container

Multiple sketches in one part: IDs increment by 6 (e.g., 52, 58, 64, 70, 76).

## Gotchas

- **Duplicate names are silent.** No error, no warning. Two sketches can have the same name. `part.getSketch` returns only the **first** match — later duplicates become unreachable by name.
- **Name validation is absent.** Empty string, 200-character strings, special characters — all succeed. There is no name uniqueness check.
- **`planeId` type is strict.** Only `workplane` and `face-plane` types accepted. Passing a part ID or sketch ID as `planeId` gives error 1001, not 1006.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | `id` param omitted |
| "invalid id" | 1006 | Non-existent ID |
| "wrong id type — provide only: ['part']" | 1001 | ID exists but is not a part |
| "wrong id type — provide only: ['workplane', 'face-plane']" | 1001 | `planeId` is not a work plane or face |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Basic — default XY plane, default name
const sk1 = (await api.v1.part.sketch({ id: partId })).result

// Named, on a custom work plane
const wpId = (await api.v1.part.workPlane({
  id: partId, normal: [0, 0, 1], position: [0, 0, 50],
})).result
const sk2 = (await api.v1.part.sketch({
  id: partId, planeId: wpId, name: 'TopSketch',
})).result

// On a solid face
const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 60 })).result
// Get face ID from graphic data
const faceId = boxR.graphic.containers[0].meshes[0].id
const sk3 = (await api.v1.part.sketch({
  id: partId, planeId: faceId, name: 'FaceSketch',
})).result
```

## Related

- `sketch.create` — identical alias in the sketch namespace
- `part.getSketch` — retrieve sketch ID by name (first match only)
- `sketch.deleteSketch` — delete sketches by ID array
- `sketch.setWorkPlane` — reassign sketch to a different work plane
- `part.workPlane` — create work planes to place sketches on
