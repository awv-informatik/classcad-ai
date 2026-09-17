# part.circularPattern

Creates a circular pattern feature that repeats target features around an axis as evenly spaced rotated copies.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — feature IDs to pattern: flat `[featureId1, featureId2]` or `[{ id: featureId, indices: [0, 1] }]` (`indices` selects solids of a multi-solid feature). Multiple targets are patterned together, keeping relative positions.
- `references` — rotation axis: work axis ID, brep edge ID (from `getGeometryIds`), or work points
- `angle` — spacing between instances **in radians** (number or `@expr.NAME`). Default 0.
- `count` — **total instances including the original** (number or `@expr.NAME`). count=6 → 1 original + 5 copies. Minimum 1 (count=1 creates the feature, no copies). Default 2.
- `inverted` — `1` reverses direction, `0` default CCW (numeric, not boolean). Default 0.
- `merged` — `1` unions all copies into a **single brep** (disjoint copies become one multi-lump brep — valid, not an error). Default 0. **Prefer `merged: 1` whenever the pattern feeds a boolean** (see Gotchas).
- `name` — default `"CircularPattern"`

## Return Value

Feature ID (numeric), maxLevel=31. Returns the feature ID even on merge failure (maxLevel=51).

## Gotchas

- **The pattern CONSUMES its targets.** The pattern owns all N instances *including the original* — `toolId` is no longer independently usable. In pattern-then-subtract, `part.boolean` tools must reference **the pattern only**: `tools: [patternId]` cuts all N; `tools: [toolId, patternId]` fails with error 1014 "already been consumed", and the message **names an arbitrary other tool** (e.g. a later, valid one), not the consumed target — highly misleading.
- **Use `merged: 1` for pattern-then-subtract — UNMERGED patterns don't regenerate correctly in booleans.** With `merged: 0`, once consumed as a boolean tool, changing the `@expr`-bound count reports success but the result is wrong (count 4→6 left the target completely uncut). With `merged: 1` the subtraction references ONE brep, independent of instance count, and **count/angle stay fully live through the boolean** (tooth count 21→24 via `updateExpression` regenerated the subtracted sprocket exactly — tooth positions and volume brep-verified). The SEED shape is live in both modes (sketch-dim edits propagate into every copy).
- **`merged: 1` works for disjoint AND overlapping copies** (4 disjoint boxes → one brep, volume exact; 6 overlapping boxes → union volume correct). Error 1001 from a merge means the copies meet in a degenerate way — e.g. a box whose face lies on the rotation axis (every copy shares that axis edge; 4, 6 or 8 copies fail, 2 copies work). Move the body off the axis or use `merged: 0`.
- **`angle=0` does NOT mean equal spacing** — it is literally 0° apart; all instances stack. Full circle: `angle = 2 * Math.PI / count` (or `'2*C:PI/count'`).
- **Direction:** default is CCW viewed from the positive axis direction (right-hand rule). `inverted: 1` with positive angle ≈ `inverted: 0` with negative angle (both CW). Pick one convention.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1001 | "Boolean operation failed with error 1001" | Copies meet degenerately (e.g. all share an edge on the axis) or self-intersecting tool bodies | Move the body off the axis or use `merged: 0` |
| 1004 | '"targets" must be provided in the api call!' | Missing targets | Pass `targets: [featureId]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CircDemo' })).result
const armCS = (await api.v1.part.workCSys({ id: partId, name: 'ArmCS', offset: [40, -5, 0] })).result
const waZ = (await api.v1.part.workAxis({ id: partId, name: 'CenterAxis', position: [0, 0, 0], direction: [0, 0, 1] })).result

// 6 arms at 60° intervals
const boxId = (await api.v1.part.box({ id: partId, name: 'Arm', length: 20, width: 10, height: 30, references: [armCS] })).result
const cpId = (await api.v1.part.circularPattern({
  id: partId, name: 'RadialArms', targets: [boxId], references: [waZ],
  angle: 1.0472, // π/3
  count: 6,
})).result

// Expression-driven equal spacing (fresh body — a pattern consumes its targets)
await api.v1.part.expression({
  id: partId,
  toCreate: [{ name: 'armCount', value: 8 }, { name: 'armAngle', value: '2*C:PI/armCount' }],
})
const arm2 = (await api.v1.part.box({ id: partId, name: 'Arm2', length: 20, width: 10, height: 30, references: [armCS] })).result
const cpExpr = (await api.v1.part.circularPattern({
  id: partId, name: 'ExprArms', targets: [arm2], references: [waZ],
  angle: '@expr.armAngle', count: '@expr.armCount',
})).result
```

## Related

`part.updateCircularPattern` · `part.linearPattern` · `part.mirror` · `part.workAxis` · `part.getGeometryIds`
