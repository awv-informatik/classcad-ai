# sketch.generateAutoConstraints

Detects and creates geometric constraints based on spatial relationships between sketch elements. Primarily useful when geometry was created in an order where creation-time auto-detection missed relationships.

## Prerequisites

- A part (`part.create`)
- A sketch with `planeId` set (`sketch.create`)
- Existing sketch geometry to analyze

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomId`** (required) — sketch-curve or sketch-point ID to analyze. **Sketch IDs are rejected** despite what the docs say ("The parameter \"geomId\" has a wrong id type! Provide only following id types: [\"sketch-curve\",\"sketch-point\"]").
- **`genFixation`** (optional, default `true`) — generate fixation constraints at origin
- **`genIncidence`** (optional, default `true`) — generate coincidence constraints (point-on-curve, point-on-point). **This is the most useful flag.**
- **`genTangency`** (optional, default `true`) — generate tangency constraints. Not observed to produce tangent constraints in testing.
- **`genVertAndHoriz`** (optional, default `true`) — generate horizontal/vertical constraints

## Return Value

Always `null` (VOID). No constraint IDs are returned. To detect what was created, diff constraint nodes in the structure tree before and after the call.

```js
const consBefore = Object.values(structureBefore.tree)
  .filter(n => n.class?.includes('Constraint'))
// call generateAutoConstraints
const consAfter = Object.values(structureAfter.tree)
  .filter(n => n.class?.includes('Constraint'))
const newConstraints = consAfter.filter(c => !consBefore.find(b => b.id === c.id))
```

## When Is It Useful?

Geometry creation APIs (`sketch.line`, `sketch.point`, `sketch.circle`, etc.) already run auto-constraint detection at creation time. Calling `generateAutoConstraints` afterward is usually a **no-op** because constraints already exist and it respects the "doesn't add up redundancy" rule.

**The API adds value when creation order prevents auto-detection:**

- Create a point at (25, 0, 0), then a line from (0,0,0) to (50,0,0). Line creation doesn't retroactively check if pre-existing points lie on the new line. Calling `generateAutoConstraints` on the point then detects the point-on-curve coincidence.
- Geometry loaded via `loadFrom` (external OFB files) may lack auto-constraints entirely.

## Idempotent / No Duplicates

Safe to call multiple times — never adds duplicate constraints. The redundancy check is robust.

## Accepted Geometry Types

| Type | Accepted? | Notes |
|---|---|---|
| Line ID | Yes | From `sketch.line` |
| Point ID | Yes | Both `sketch.point` and `getPoints().startId/endId` |
| Circle ID | Yes | Must be created with `centerPos` (not `center`) |
| Arc ID | Yes | Must be created with `centerPos` |
| Sketch ID | **No** | Error: wrong id type |

## Gotchas

- **Sketch ID as geomId fails.** The docs claim it works ("the sketch id itself to autoconstraint each of sketch's objects") but it doesn't. You must pass individual geometry IDs.
- **Tangency not detected.** In testing, geometrically tangent circle+line configurations did not produce tangent constraints via autoGen. The `genTangency` flag had no observable effect.
- **Most calls are no-ops.** If you created geometry through standard APIs (line, circle, rectangle), constraints were already auto-generated. AutoGen won't find anything new unless creation order caused a miss.
- **VOID error from null IDs.** If circle/arc creation fails (returns null) and you pass null to autoGen, you get the confusing error `"Set the parameter \"geomId\" = VOID is not allowed"`. Always check that creation succeeded before calling autoGen.

## Working Example

```js
const partR = await api.v1.part.create({ name: 'AutoGenDemo' })
const partId = partR.result
const topPlane = Object.values(partR.structure.tree)
  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

// Create point FIRST, then line through it
const ptId = (await api.v1.sketch.point({ id: skId, pos: [25, 0, 0] })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
// At this point, no coincidence between point and line exists

// Auto-detect the point-on-line coincidence
const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: ptId })
// r.result = null (always VOID)
// r.maxLevel = 31 (success)
// A new CC_2DCoincidentConstraint "Auto_Coinc" is now in the structure tree
```

## Flag Control

```js
// Suppress coincidence detection
await api.v1.sketch.generateAutoConstraints({
  id: skId, geomId: ptId, genIncidence: false
})
// → No coincidence added

// Only detect coincidence, skip fixation/H/V/tangency
await api.v1.sketch.generateAutoConstraints({
  id: skId, geomId: ptId,
  genFixation: false, genVertAndHoriz: false, genTangency: false,
  genIncidence: true
})
```

## Related

- `sketch.constraint` — manual constraint creation (explicit type + geomIds)
- `sketch.line`, `sketch.circle`, etc. — auto-generate constraints at creation time
- `sketch.loadFrom` — loads geometry that may lack auto-constraints (prime candidate for autoGen)
- `sketch.getGeometry` — inspect the structure tree for constraint nodes
