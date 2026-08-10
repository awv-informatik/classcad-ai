# sketch.create

Creates a new sketch inside a part. Returns the sketch ID. Alias: `part.sketch` (identical behavior and signature).

## Prerequisites

- A part (`part.create`)
- Optional: a work plane ID (`part.workPlane`) or face ID from solid geometry

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — sketch name, default `"Sketch"`. Duplicate names are silently allowed — no warning, no error. But `part.getSketch` only returns the first match, so use unique names if you need name-based lookup.
- **`planeId`** (optional) — where to place the sketch:
  - **Work plane ID** → sketch placed directly on that plane
  - **Face ID** (from solid geometry) → system auto-creates a work plane on that face, then places the sketch
  - **Omitted** → sketch placed on the default XY plane at origin (coordinateSystem `[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]`, `planeReference=0`)

## Return Value

```js
{ result: id, messages?: [...], maxLevel?: real }
```

Returns the sketch ID (a `CC_Sketch` node). maxLevel=31 on success.

## What Gets Created

Creating one sketch adds **3 objects** to the structure tree:

| Object | Class | Purpose |
|--------|-------|---------|
| Sketch | `CC_Sketch` | The sketch itself — this is the returned ID |
| Sketch Reference | `CC_SketchReference` | Reference geometry container (child of geometry set) |
| Sketch Dimension Set | `CC_SketchDimensionSet` | Dimension container (child of dimension set) |

IDs increment by ~6 per sketch (e.g., first sketch at 52, second at 58, third at 64).

## Critical: Always Pass `planeId`

**Sketches without an explicit `planeId` have a disabled constraint solver.** When `planeId` is omitted (`planeReference=0`), constraints and dimensions are stored in the structure tree but the 2D solver never runs — `updateDimension` returns `result: 0` (unsolved) and geometry does not move. No error is raised.

When `planeId` is set (work plane or face ID), the solver works correctly:
- `updateDimension` returns `result: 1` (solved) and repositions geometry
- Geometric constraints (COINCIDENT, HORIZONTAL, etc.) actively enforce relationships
- `moveGeometry` respects constraints during solving

**Always create sketches with a plane.** Use a standard work plane (Top=38, Front=42, Right=46 on a fresh part), a custom work plane from `part.workPlane`, or a face ID:

```js
// ✅ Correct — solver works
const partR = await api.v1.part.create({ name: 'MyPart' })
const topPlane = Object.values(partR.structure.tree)
  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
const skId = (await api.v1.sketch.create({ id: partR.result, planeId: topPlane.id })).result

// ❌ Solver disabled — constraints/dimensions stored but never enforced
const skId = (await api.v1.sketch.create({ id: partId })).result
```

## Gotchas

- **Without `planeId`, the constraint solver is off.** See section above. **Error signature:**
  on a planeless sketch, `sketch.dimension`/`updateDimension` with a `value` fail with
  maxLevel 51 `"Couldn't set the value for dimension $N"` — for @expr AND plain numeric values
  alike. If you see this on a sketch that "should" have a plane, verify the planeId you passed
  actually resolved (a `planes['Front']` lookup on a map that lacks the key passes `undefined`
  SILENTLY — `sketch.create` returns maxLevel 31 and a valid-looking id; cost 2h of solver-state
  ghost-hunting, 2026-08-10 sprocket-parametric-B).
- **Duplicate names are silent.** No error, no warning. The second sketch with the same name just gets a different ID. `part.getSketch` returns the **first** match only — so duplicates make later sketches unreachable by name.
- **`sketch.create` vs `part.sketch`** — these are the same API with identical params and behavior. Both live in different namespaces but do the same thing.
- **Default plane is XY.** When `planeId` is omitted, the sketch lives on the XY plane at origin. The `planeReference` member is 0 (no explicit reference).
- **Faces auto-create work planes.** When `planeId` is a face, the system creates an implicit work plane on that face. This is how you sketch on existing solid geometry.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | Missing `id` param |
| "invalid id" | 1006 | Non-existent or invalid part ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Basic — default XY plane
const sk1 = (await api.v1.sketch.create({ id: partId })).result

// On a custom work plane
const wpId = (await api.v1.part.workPlane({
  id: partId,
  normal: [0, 0, 1],
  position: [0, 0, 50],
})).result
const sk2 = (await api.v1.sketch.create({
  id: partId,
  planeId: wpId,
  name: 'SketchOnPlane',
})).result

// On a face (from a box)
const boxId = (await api.v1.part.box({ id: partId, xLen: 100, yLen: 80, zLen: 60 })).result
// Get face IDs from graphic data
const faceId = boxR.graphic.containers[0].meshes[0].id
const sk3 = (await api.v1.sketch.create({
  id: partId,
  planeId: faceId,
  name: 'SketchOnFace',
})).result
```

## Related

- `part.sketch` — identical alias in the part namespace
- `part.getSketch` — retrieve sketch ID by name (returns first match only)
- `sketch.setWorkPlane` — reassign sketch to a different work plane (work plane IDs only — does NOT accept face IDs)
- `sketch.deleteSketch` — delete sketches by ID array
- `part.workPlane` — create work planes to place sketches on
