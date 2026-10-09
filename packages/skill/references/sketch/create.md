# sketch.create

Creates a sketch inside a part; returns the `CC_Sketch` ID (maxLevel 31). Alias: `part.sketch` (identical params and behavior).

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — default `"Sketch"`. Duplicates are silently allowed, but `part.getSketch` returns only the **first** match — later duplicates are unreachable by name.
- **`planeId`** — placement:
  - **Work plane ID** → sketch on that plane
  - **Face ID** → an implicit work plane is auto-created on the face (how you sketch on solids)
  - **Omitted** → default XY plane at origin (coordinateSystem `[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]`, `planeReference=0`)

## Critical: Always Pass `planeId`

**Without `planeId` the 2D solver is disabled.** Constraints are accepted (maxLevel 31, ids returned) but never enforced; a dimension WITH a `value` fails (error signature below) while its solver constraint is stored anyway; `updateDimension` returns `result: 0` and geometry doesn't move. With `planeId` (work plane or face), `updateDimension` re-solves and repositions geometry, geometric constraints enforce, `moveGeometry` respects constraints.

Use a standard plane (Top=38, Front=42, Right=46 on a fresh part; look up via `part.getWorkGeometry({ id, name: 'Top' })`), a `part.workPlane`, or a face ID.

**Error signature:** on a planeless sketch, `sketch.dimension`/`updateDimension` with a `value` fail with maxLevel 51 `"Couldn't set the value for dimension $N"` — for @expr AND numeric values. One-call checks: `sketch.getGlobalState` stays `UNDEFINED` with geometry present, and `sketch.getDiagnosticsInfo` lists EVERY constraint as `unsatisfied`. If the sketch "should" have a plane, check that `planeId` actually resolved: a `planes['Front']` lookup on a map lacking the key passes `undefined` SILENTLY, and `sketch.create` still returns maxLevel 31 with a valid-looking id.

## What Gets Created

| Class | Purpose |
|--------|---------|
| `CC_Sketch` | The sketch (returned ID) |
| `CC_SketchReference` | Reference geometry container (child of geometry set) |
| `CC_SketchDimensionSet` | Dimension container (child of dimension set) |

IDs increment by ~6 per sketch (52, 58, 64, …).

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | Missing `id` |
| "invalid id" | 1006 | Nonexistent/invalid part ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Standard plane (solver active)
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result

// Custom work plane
const wpId = (await api.v1.part.workPlane({ id: partId, normal: [0, 0, 1], position: [0, 0, 50] })).result
const sk2 = (await api.v1.sketch.create({ id: partId, planeId: wpId, name: 'SketchOnPlane' })).result

// Face: top face of a 100×80×60 box
await api.v1.part.box({ id: partId, length: 100, width: 80, height: 60 })
const faceId = (await api.v1.part.getGeometryIds({ id: partId, planes: [{ positions: [[50, 40, 60]] }] })).result.planes[0]
const sk3 = (await api.v1.sketch.create({ id: partId, planeId: faceId, name: 'SketchOnFace' })).result
```

## Related

`part.sketch` · `part.getSketch` · `sketch.setWorkPlane` · `sketch.deleteSketch` · `part.workPlane`
