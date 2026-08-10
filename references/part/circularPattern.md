# part.circularPattern

Creates a circular pattern feature that repeats one or more target features around an axis, producing evenly spaced rotated copies.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- A rotation axis reference: work axis, brep edge, or work points

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to pattern. Two formats:
  - Flat IDs: `[featureId1, featureId2]`
  - Object format: `[{ id: featureId, indices: [0, 1] }]` — `indices` selects specific solids when a feature has multiple
- `references` — array containing a work axis ID or brep edge ID defining the rotation axis
- `angle` — angular spacing between instances **in radians** (number or `@expr.NAME`). Default 0.
- `count` — **total number of instances including the original** (number or `@expr.NAME`). count=6 → 1 original + 5 copies. Minimum 1. Default 2.
- `inverted` — `1` to reverse rotation direction, `0` for default CCW (numeric, not boolean). Default 0.
- `merged` — `1` to boolean-union all copies. **Currently broken** — always fails with error 1001. Default 0.
- `name` — feature name (default `"CircularPattern"`)

## Return Value

Feature ID (numeric) on success, maxLevel=31 (info). Returns the feature ID even on merge failure (maxLevel=51).

## Gotchas

- **The pattern CONSUMES its target features** (verified 2026-08-10, sprocket session). After
  `circularPattern({ targets: [toolId], count: N })`, the pattern feature owns all N instances
  *including the original* — `toolId` is no longer independently usable. Consequence for the
  pattern-then-subtract idiom: `part.boolean` tools must reference **the pattern only** —
  `tools: [patternId]` cuts all N instances; `tools: [toolId, patternId]` fails with error 1014
  "already been consumed", and the message **names an arbitrary other tool** (e.g. a later,
  perfectly valid one), not the offending consumed target — highly misleading when debugging.
- **Count/angle FREEZE at boolean consumption** (verified 2026-08-10): once the pattern is used as
  a boolean tool, `@expr`-bound count/angle stop tracking their expressions, and even explicit
  `openFeature`+`updateCircularPattern`+`closeFeature` reports success (maxLevel 31, id returned)
  while changing NOTHING. The pattern's SEED shape stays live (sketch-dim edits propagate into
  every copy), only the count/spacing are dead. Tooth-count-style parameters are rebuild
  parameters, not model parameters.
- **`angle=0` does NOT mean equal spacing.** It means literally 0° between copies — all instances stack at the same position. For equal spacing around a full circle, calculate: `angle = 2 * Math.PI / count` (or `'2*C:PI/count'` as expression).
- **`count` includes the original.** count=4 means 4 total bodies, not 4 copies. count=1 creates the feature but adds no copies.
- **`merged: 1` fails** with "Boolean operation failed with error 1001" for circularPattern. The feature is created and copies are placed, but the boolean union step fails. Bodies remain separate. Use `part.boolean` with `type: 'UNION'` after creation as a workaround.
- **`inverted` and `angle` sign both control direction.** `inverted: 1` with positive angle ≈ `inverted: 0` with negative angle. Both reverse the rotation from default CCW to CW (when viewed from the positive direction of the axis). Pick one convention and stick to it.
- **Default rotation is CCW** when viewed from the positive direction of the reference axis (right-hand rule).
- **Brep edges work as rotation axis references.** Use `getGeometryIds` to find edge IDs from existing geometry.
- **Multiple targets are patterned together**, maintaining their relative positions around the axis.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1001 | "Boolean operation failed with error 1001" | `merged: 1` (known bug) | Use `merged: 0` and `part.boolean` after |
| 1004 | '"targets" must be provided in the api call!' | Missing targets | Pass `targets: [featureId]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CircDemo' })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Arm',
  length: 20, width: 10, height: 30,
  xPosition: 40, yPosition: -5, zPosition: 0,
})).result

const waZ = (await api.v1.part.workAxis({
  id: partId, name: 'CenterAxis',
  origin: [0, 0, 0], direction: [0, 0, 1],
})).result

// 6 copies at 60° intervals (full circle)
const cpId = (await api.v1.part.circularPattern({
  id: partId,
  name: 'RadialArms',
  targets: [boxId],
  references: [waZ],
  angle: 1.0472, // π/3 = 60°
  count: 6,
})).result

// Expression-driven spacing
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'armCount', value: 8 },
    { name: 'armAngle', value: '2*C:PI/armCount' },
  ],
})
const cpExpr = (await api.v1.part.circularPattern({
  id: partId,
  name: 'ExprArms',
  targets: [boxId],
  references: [waZ],
  angle: '@expr.armAngle',
  count: '@expr.armCount',
})).result
```

## Related

- `part.updateCircularPattern` — modify after creation (requires openFeature/closeFeature)
- `part.linearPattern` — linear copies along one or two directions
- `part.mirror` — reflection across a plane
- `part.workAxis` — create rotation axis references
- `part.getGeometryIds` — get brep edge IDs for axis references
