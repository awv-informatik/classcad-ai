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
- `merged` — `1` to union all copies into a **single brep** (disjoint copies become one multi-lump brep — that is valid, not an error). Default 0. **Prefer `merged: 1` whenever the pattern feeds a boolean**: the subtraction then references ONE tool and becomes independent of the instance count — count/angle stay live through the boolean (see Gotchas).
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
- **Use `merged: 1` for pattern-then-subtract — UNMERGED patterns freeze in booleans** (verified
  2026-08-10, sprocket sessions): with `merged: 0`, once the pattern is consumed as a boolean
  tool, `@expr`-bound count/angle stop tracking their expressions, and even explicit
  `openFeature`+`updateCircularPattern`+`closeFeature` reports success (maxLevel 31) while
  changing nothing. With **`merged: 1`** the pattern emits a single brep, the subtraction is
  independent of the instance count, and **count/angle remain fully live through the boolean**
  (verified: tooth count 21→24 via `updateExpression` regenerated the subtracted sprocket
  exactly — new tooth positions and volume both brep-verified). The SEED shape is live in both
  modes (sketch-dim edits propagate into every copy).
- **`angle=0` does NOT mean equal spacing.** It means literally 0° between copies — all instances stack at the same position. For equal spacing around a full circle, calculate: `angle = 2 * Math.PI / count` (or `'2*C:PI/count'` as expression).
- **`count` includes the original.** count=4 means 4 total bodies, not 4 copies. count=1 creates the feature but adds no copies.
- **`merged: 1` works for disjoint AND overlapping copies** (probed 2026-08-10: 4 disjoint boxes → one brep, volume exact; 6 overlapping boxes → union volume correct). A 2026-04-20 session recorded it as "always fails with error 1001" — that does not reproduce on current builds; if you see 1001 from a merge, suspect degenerate tool bodies, not the flag.
- **`inverted` and `angle` sign both control direction.** `inverted: 1` with positive angle ≈ `inverted: 0` with negative angle. Both reverse the rotation from default CCW to CW (when viewed from the positive direction of the axis). Pick one convention and stick to it.
- **Default rotation is CCW** when viewed from the positive direction of the reference axis (right-hand rule).
- **Brep edges work as rotation axis references.** Use `getGeometryIds` to find edge IDs from existing geometry.
- **Multiple targets are patterned together**, maintaining their relative positions around the axis.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1001 | "Boolean operation failed with error 1001" | Degenerate/self-intersecting tool bodies in the merge or boolean | Fix the tool geometry (NOT a `merged` bug — see Gotchas) |
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
