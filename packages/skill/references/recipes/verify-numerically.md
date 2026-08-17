# Recipe: Verify geometry numerically (don't trust success codes or looks)

ClassCAD reports success (maxLevel 31) for several operations that silently did
nothing or produced wrong geometry — frozen unmerged patterns, no-op expression
forms, dead solvers on planeless sketches. And a rendered view auto-scales, so a
wrong size can look identical. **A spatial claim ("the bore is Ø30 now", "all 12
cuts exist") needs a measured number behind it.**

## Tier 1 — mass properties (cheap, catches most wrongness)

```js
const mp = await api.v1.part.calculateMassProperties({ id: partId })
// → volume, surface area, center of gravity
```

Compare the volume against an independent expectation (compute it in your script
from the design math — blank minus holes, etc.). Rules of thumb:

- Regenerated a parameter → volume must move in the right DIRECTION and roughly the
  right magnitude. Unchanged volume after a "successful" update = frozen feature.
- N patterned cuts → missing instances show up as `+1/N` volume steps.
- Null mass properties on a body that existed a step earlier = the body was
  destroyed (e.g. `common.recalc` in a direct/EIF flow, or a failed boolean).

## Tier 2 — bounds (position/extent claims)

```js
// buerli namespace — POSITIONAL args
const b = await structure.calculateProductBounds(rootOrPartId)
// → { center, min, max, radius }   (radius -1 = empty/no geometry)
```

Extent = `max − min`. Use for "the part is 80 long", "centered on origin",
"the cut went through".

## Tier 3 — brep probes (exact feature positions)

Prove a specific feature exists where the math says it should:

```js
const ids = await api.v1.part.getGeometryIds({ id: partId, /* filter: circles/arcs/cylinders/lines */ })
const pos = await api.v1.part.getGeometryPositions({ id: partId, geometryIds: [...] })
```

- Entries for types with no match come back as **empty arrays (truthy!)** — flatten
  and keep numbers: `ids.flat().filter(x => typeof x === 'number')`
  ([part/getGeometryIds](../part/getGeometryIds.md)).
- **Full-circle edges are seam-split into 2 arcs** — a bore rim yields two arc ids,
  and after regeneration the seam azimuth can move. To collect a full rim, sweep
  candidate edges by position instead of assuming one id.
- Cylindrical faces (`cylinders`) are often easier to find than their rim arcs —
  probe the face radius/axis instead.
- A probe point comparison: compute the expected coordinate analytically, measure,
  assert the distance ≈ 0 (float precision: expect ≤1e-6 of the model scale).

## When to verify

| Situation | Verification |
|---|---|
| Single simple feature (a box, one fillet) | none — the returned id + no error is enough |
| Multi-feature constructive build | Tier 1 after the final boolean, Tier 3 on one or two key features |
| After every `updateExpression` regen | Tier 1 + Tier 3 on the changed feature |
| Boolean/pattern/slice that could silently mis-cut | Tier 1 before AND after (delta check) |
| Claim about position/alignment/extent | Tier 2 or Tier 3 — never from the rendered view alone |

Verification failures are findings, not annoyances: when measurement and
expectation disagree, stop and investigate — one of them is wrong, and it is not
always the model.

## Related

[part/calculateMassProperties](../part/calculateMassProperties.md) ·
[part/getGeometryIds](../part/getGeometryIds.md) ·
[recipes/parametric-part](parametric-part.md) · [recipes/pattern-then-subtract](pattern-then-subtract.md)
