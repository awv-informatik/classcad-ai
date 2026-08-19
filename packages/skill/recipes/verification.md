# Recipe — verification (mandatory for every build)

ClassCAD reports success (maxLevel 31) for several operations that silently
did nothing or produced wrong geometry — frozen unmerged patterns, no-op
expression forms, dead solvers on planeless sketches. And a rendered view
auto-scales, so a wrong size can look identical. Correctness therefore has
two halves, and both need proof:

- **Execution** — the model matches your plan → numeric verification (Part II).
- **Interpretation** — your plan matches the input → perception discipline
  (Part I). Green numbers cannot save a mirrored reading: six independent
  runs built the same part with a C-cut facing the wrong way, each with a
  full suite of passing probes, because every probe target was derived from
  the same misread image.

## Which regime? — the INPUT TYPE decides

| Input | Regime |
| --- | --- |
| **Plain-text spec** (numbers in the prompt) | Part II only — no perception phase |
| **Technical drawing** (image WITH dimension callouts) | Part I in full, then Part II; the frozen record drives the probes |
| **Image/photo WITHOUT dimensions** | Part I in full; Part II verifies proportions, feature counts and topology instead of absolutes — state your assumed scale explicitly |
| **Dynamic/iterative prompts** (user steers as you go) | Part II per increment; re-run the Part I questions whenever the wording implies a side, direction, or handedness |

---

# Part I — perception first (any input reference)

## Phase 0 — the REFERENCE RECORD (before any modeling)

Write the record down (notes tool / your plan) BEFORE the first build call.
It is the contract the final verification tests against.

0. **Forced-choice perception pass — FIRST, before everything else.**
   Measured fact (2026-08-18): the same model read a C-ring's opening
   direction wrong in 6/6 full CAD runs, but right in 3/3 when asked as an
   isolated question — task context collapses perception onto a gestalt and
   every later "evidence" confabulates around it. So: BEFORE inventorying
   dimensions or planning anything, glance at the reference only to spot the
   chirality-critical features (openings, notches, asymmetric bosses,
   handedness of ribs), then answer ONE BINARY IMAGE-SPACE QUESTION per
   feature, as if there were no task: "in image space, does the ring's gap
   face the lower-left (where the rib enters) or the upper-right?" — answer
   with pixel evidence (which edge, roughly where). Use a magnified crop of
   the critical region if one is available or obtainable (3/3 vs 2/3 in the
   measurement). These answers are FROZEN: the later holistic reading may
   add facts but may NOT overturn them — if it disagrees, that is a LOW
   CONFIDENCE conflict for the mirror check, not a revision.
1. **Inventory**: which views does the reference show (iso, front, top, …)?
   What resolution is the image? Below ~800 px, fine features — especially
   chirality — are LOW CONFIDENCE: say so in the record.
2. **Callout anchors** — the strongest spatial evidence in a drawing. For
   every dimension callout, write what its leader/arrows physically TOUCH:
   "Ø30 leader enters from the upper right and lands on the inner arc".
   Leaders point at real geometry; silhouette impressions can lie, callouts
   rarely do. (No callouts — a photo? Anchor on shadows, contact lines and
   feature counts instead, and verify proportions rather than absolutes.)
3. **Chirality facts get a TWO-HYPOTHESIS adjudication** — first impressions
   mirror. For every handedness/side/direction fact, write BOTH readings
   (e.g. "C opens toward the rounded end" vs "C opens away from it") and
   score each against the independent evidence channels:
   - **callout approach** — with an OPERATIONAL test, not a feeling: trace
     the leader from its text to the feature. Does it cross the part's
     silhouette/material on the way? A leader that reaches an INNER feature
     without crossing the surrounding ring's material tells you the gap is
     on its approach side. Answer per leader: "crosses material: yes/no".
   - **silhouette/edge continuity**,
   - **hidden/dashed lines**,
   - **symmetry** (which facts are even at mirror risk).
   Channel ranking: callout approach (with its crossing test) outranks
   everything; at low resolution (<~800 px) a silhouette impression is
   INADMISSIBLE as sole evidence for chirality. **Mechanical plausibility is
   a PRIOR, not evidence** — it describes typical parts, not this part
   (real parts DO have ribs meeting curved walls and cuts opening off the
   plate); use it only to break ties when every image channel is silent,
   never to override a callout reading. If your channels disagree, the fact
   is LOW CONFIDENCE: say so in the record, and the mirror check below is
   the decider.
4. **Ambiguity is spoken, never swallowed**: if two readings survive, state
   the ambiguity. Interactive host → ask the user ONE confirmation question
   ("the C opens away from the rounded end — correct?"); one answer beats any
   heuristic. Headless → pick the higher-ranked channel and SAY which channel
   decided.

## Build

Implement the record (Part II discipline per stage). The record is frozen —
if mid-build evidence contradicts it, stop and re-derive the record from the
reference, don't patch silently.

## Final gate — four steps, in order

1. **Matched-view renders**: one snapshot per reference view, oriented like
   the reference (snapshot supports named views AND `{azimuth, elevation}` —
   match the iso's octant; front/top/right for orthographic views). A
   comparison against an arbitrary ISO is not a comparison.
2. **Mirror check (forced choice)** — for every chirality fact, and always
   when one was LOW CONFIDENCE: FIRST, before rendering anything, write down
   the reference's answer in image-space terms ("in the REFERENCE image, the
   opening is on the upper-RIGHT of the tower"). Committing to it before
   seeing your renders prevents the renders from steering the reading. THEN
   render the matched view AND its mirror (negate the azimuth) and answer
   the same image-space question for each render independently. Pick which
   render matches the committed reference answer. Forced choice between two
   images is far more reliable than judging handedness in one. If the MIRROR
   matches, your reading is flipped: fix the model, don't re-argue the record.
3. **Record replay, numerically**: walk the reference record row by row and
   prove each orientation fact with a probe — material-presence at a test
   point, extents asymmetry, face position (Part II Tier 3). A fact you can
   probe beats a fact you can eyeball.
4. **Second reading**: with the build done, re-derive the chirality facts
   FROM THE REFERENCE IMAGE AGAIN — fresh, not from memory of your record —
   and diff against the record. Any difference between render and reference
   is EXPLAINED BY A MEASUREMENT or it is a defect: "different viewing
   angle" is never an explanation — it is the rationalization that ships
   mirrored parts.

---

# Part II — numeric verification (every build)

## Tier 1 — mass properties (cheap, catches most wrongness)

```js
const mp = await api.v1.part.calculateMassProperties({ id: partId })
// → volume, surface area, center of gravity
```

Compare the volume against an independent expectation (compute it in your
script from the design math — blank minus holes, etc.). Rules of thumb:

- Regenerated a parameter → volume must move in the right DIRECTION and
  roughly the right magnitude. Unchanged volume after a "successful" update
  = frozen feature.
- N patterned cuts → missing instances show up as `+1/N` volume steps.
- Null mass properties on a body that existed a step earlier = the body was
  destroyed (e.g. `common.recalc` in a direct/EIF flow, or a failed boolean).
- Photo-input case: no absolute volume to check — verify RATIOS (feature
  size vs overall extent) and counts against the image instead.

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

- Entries for types with no match come back as **empty arrays (truthy!)** —
  flatten and keep numbers: `ids.flat().filter(x => typeof x === 'number')`
  ([part/getGeometryIds](../references/part/getGeometryIds.md)).
- **Full-circle edges are seam-split into 2 arcs** — a bore rim yields two
  arc ids, and after regeneration the seam azimuth can move. To collect a
  full rim, sweep candidate edges by position instead of assuming one id.
- Cylindrical faces (`cylinders`) are often easier to find than their rim
  arcs — probe the face radius/axis instead.
- A probe point comparison: compute the expected coordinate analytically,
  measure, assert the distance ≈ 0 (float precision: expect ≤1e-6 of the
  model scale).

## When to verify

| Situation | Verification |
|---|---|
| Single simple feature (a box, one fillet) | none — the returned id + no error is enough |
| Multi-feature constructive build | Tier 1 after the final boolean, Tier 3 on one or two key features |
| After every `updateExpression` regen | Tier 1 + Tier 3 on the changed feature |
| Boolean/pattern/slice that could silently mis-cut | Tier 1 before AND after (delta check) |
| Claim about position/alignment/extent | Tier 2 or Tier 3 — never from the rendered view alone |
| Input reference present | ALL of Part I, with the record's facts probed via Tier 3 |

Verification failures are findings, not annoyances: when measurement and
expectation disagree, stop and investigate — one of them is wrong, and it is
not always the model.

## Tessellation trap (graphic-based probes)

The mesh you probe is faceted at the drawing's chord tolerance — **default
`chordHeightTol 0.1` in MODEL UNITS** (worker-global). Consequences (verified
2026-08-17, both bit an agent):

- On features smaller than ~50× the tolerance (an inch-model seat arc r=0.101
  vs tol 0.1!), faces emit endpoint-only vertices — a probe can conclude a
  cut is MISSING when it is present. Mesh vertices may sit ~1e-5+ off the
  exact surface even when fine.
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
[recipes/parametric-part](parametric-part.md) ·
[recipes/pattern-then-subtract](pattern-then-subtract.md) ·
[recipes/constrained-sketching](constrained-sketching.md)
