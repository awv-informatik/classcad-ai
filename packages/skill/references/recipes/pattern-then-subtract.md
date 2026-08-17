# Recipe: Pattern a cutting tool, then subtract (holes, teeth, slots on a circle)

The standard idiom for "N identical cutouts around an axis": build ONE tool body,
pattern it, subtract the pattern. Verified on bolt circles and sprocket tooth spaces.

## The idiom

```js
// 1. One tool body (extrusion of the cutout profile, a cylinder, …)
const toolId = (await api.v1.part.extrusion({ id: partId, sketch: cutSketch, height: 20 })).result

// 2. Pattern it — MERGED, so the copies become a single brep
const axis = (await api.v1.part.workAxis({ id: partId, origin: [0,0,0], direction: [0,0,1] })).result
const pat = (await api.v1.part.circularPattern({
  id: partId,
  targets: [toolId],
  references: [axis],
  count: 12,
  angle: '2*C:PI/12',        // angle is BETWEEN instances, in radians — 0 stacks them!
  merged: 1,                 // ← single-brep tool; see why below
})).result

// 3. Subtract the PATTERN (not the original tool)
await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', targets: [blankId], tools: [pat] })
```

## The three rules

1. **The pattern CONSUMES its targets.** After patterning, `toolId` is inside the
   pattern — the boolean must reference `tools: [pat]` only. Passing the original
   tool too fails with error 1014 "already been consumed", and the message names an
   arbitrary OTHER feature, not the offending one — don't chase the named feature.

2. **Always `merged: 1` when the pattern feeds a boolean.** Merged, the pattern is
   one brep and the subtraction is independent of the instance count — `count`/`angle`
   (including `@expr` bindings) stay fully live afterwards. Unmerged patterns freeze
   silently once consumed: expression updates and even explicit
   `updateCircularPattern` report success and change nothing.

3. **`angle` is the spacing, not the span.** `angle: 0` puts every copy in the same
   place. Full circle → `2π/count`. `count` includes the original.

## Variations

- **Expression-driven count**: create `nHoles` and `holeAngle = '2*C:PI/nHoles'`
  expressions, pass `count: '@expr.nHoles', angle: '@expr.holeAngle'`. With
  `merged: 1` a later `updateExpression` regenerates the subtracted result.
- **Multiple distinct tools**: pattern them together (`targets: [t1, t2]`) — relative
  positions are preserved; still subtract only the pattern.
- **Disjoint copies + `merged: 1` is valid** — the merge produces one multi-lump brep.
  If a merge fails with error 1001, the tool body itself is degenerate
  (self-intersecting profile), not the flag.

## Verify

Volume must drop by ~N × (single-cut volume); probe one cut at an azimuth other than
the original's to prove the pattern actually cut everywhere —
[recipes/verify-numerically](verify-numerically.md).

## Related

[part/circularPattern](../part/circularPattern.md) · [part/boolean](../part/boolean.md) ·
[part/linearPattern](../part/linearPattern.md) · [recipes/parametric-part](parametric-part.md)
