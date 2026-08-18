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
  ([part/getGeometryIds](../references/part/getGeometryIds.md)).
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

## Reference reproduction — verify INTENT, not just execution

Everything above validates "is the model what I intended to build?". When the
task reproduces a REFERENCE (a drawing, an image, an existing part), that is
the wrong question half the time: a mirrored/mis-oriented interpretation
passes every volume/bounds/dimension check with green numbers, because the
model faithfully matches the wrong intent (observed 2026-08-18: a half-round
tower built with its bulge facing the wrong way — 11/11 numeric checks passed
on a mirrored part; the agent SAW the difference in the renders and attributed
it to viewing angle).

Discipline for any reference reproduction:

1. **Feature checklist BEFORE building.** From each reference view, list the
   distinctive TOPOLOGY/ORIENTATION facts, not just sizes: which side an
   opening faces, where a bulge points relative to another landmark, which
   lines exist (or don't) in which view, what is asymmetric/chiral. These
   rows sit next to the dimension checklist and gate completion the same way.
2. **Convert each fact into a NUMERIC probe.** Orientation is measurable:
   "bulge apex at the FAR end" → probe where material exists (mesh extents /
   material-presence at a test point); "notch opens to the flat face" → probe
   that the bore region is empty on that side and solid on the other. A fact
   you can probe beats a fact you can eyeball.
3. **Render the reference's own views** (same view directions) and check the
   checklist row by row. "Roughly matches" is a FAIL: any visible difference
   between render and reference is either EXPLAINED BY A MEASUREMENT or it is
   a defect — "different viewing angle" is not an explanation, it is the
   rationalization that ships mirrored parts.

## Tessellation trap (graphic-based probes)

The mesh you probe is faceted at the drawing's chord tolerance — **default
`chordHeightTol 0.1` in MODEL UNITS** (worker-global). Consequences (verified
2026-08-17, both bit an agent):

- On features smaller than ~50× the tolerance (an inch-model seat arc r=0.101
  vs tol 0.1!), faces emit endpoint-only vertices — a probe can conclude a cut
  is MISSING when it is present. Mesh vertices may sit ~1e-5+ off the exact
  surface even when fine.
- Cure 1 (exact): probe the BREP, not the mesh — `getGeometryIds` +
  `getGeometryPositions` return analytic positions.
- Cure 2 (mesh): `common.setFacetingParameters({ angleTol: 0, chordHeightTol:
  <bboxDiag/3000> })` + `recalc`, probe, then RESTORE the previous values —
  the setting persists worker-globally across sessions.
- Snapshots are already safe: the renderer applies adaptive fine faceting for
  the image and restores the params (`quality: 'fast'` opts out).

## Related

[part/calculateMassProperties](../references/part/calculateMassProperties.md) ·
[part/getGeometryIds](../references/part/getGeometryIds.md) ·
[recipes/parametric-part](parametric-part.md) · [recipes/pattern-then-subtract](pattern-then-subtract.md)
