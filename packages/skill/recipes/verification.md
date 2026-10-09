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

| Input                                                 | Regime                                                                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plain-text spec** (numbers in the prompt)           | Part II only — no perception phase                                                                                                                                                            |
| **Technical drawing** (image WITH dimension callouts) | Part I in full, then Part II; the frozen record drives the probes. Build path: recipes/constrained-sketching — dimension checklist → constraints + dimensions; the solver lays out the sketch |
| **Image/photo WITHOUT dimensions**                    | Part I in full; Part II verifies proportions, feature counts and topology instead of absolutes — state your assumed scale explicitly                                                          |
| **Dynamic/iterative prompts** (user steers as you go) | Part II per increment; re-run the Part I questions whenever the wording implies a side, direction, or handedness                                                                              |

---

# Part I — perception first (any input reference)

The measured differentiator: the same model that
misreads a part's handedness while planning a build reads it correctly when
asked in isolation — wrong 6/6 with a build task in context, right 9/9
without one. Perception is not the bottleneck; build-task context is, and
in-task probes then VALIDATE a misreading because every probe target
derives from it. This phase therefore (a) converts handedness questions
into LOCAL alignment questions, and (b) moves the reading outside the
build context wherever the host allows.

## Phase 0 — the REFERENCE RECORD (before any modeling)

Write the record down (notes tool / your plan) BEFORE the first build call.
It is the contract the final verification tests against, and it is FROZEN:
the later holistic reading may add facts but may not overturn them — a
disagreement marks the fact LOW CONFIDENCE for the mirror check, never a
silent revision.

1. **Inventory** — which views the reference shows (iso, front, top, …),
   and the image resolution. Below ~800 px, fine features — especially
   handedness — are LOW CONFIDENCE: say so in the record. For a multi-view
   technical drawing also record the **projection method** — it decides
   which side each view looks from, so a wrong one mirrors the part (see
   recipes/constrained-sketching, "Projection method").
2. **Callout anchors** — for every dimension callout, write what its
   leader/arrows physically TOUCH ("Ø30 leader enters upper-right, lands
   on the inner arc") and whether the leader CROSSES the part's material
   on the way — a leader that reaches an inner feature without crossing
   the surrounding material tells you the gap is on its approach side.
   Callouts outrank silhouette impressions; at low resolution a silhouette
   impression alone is inadmissible for handedness. (Photo without
   callouts: anchor on shadows, contact lines and feature counts; verify
   proportions rather than absolutes.)
3. **List every side/direction/handedness fact** — every asymmetry the
   part cannot be mirrored across, whatever the part is. ALL of them, not
   just the ones that feel uncertain: for handedness, confidence and
   accuracy are uncorrelated — the confident readings were the wrong ones.
4. **Resolve by COINCIDENCE before rotation.** Hunt for alignments first:
   flush faces, tangencies, shared centrelines, collinear silhouette
   edges, features lining up across views. "Is this face flush with that
   one?" is local and objective; "which way does it open?" needs the
   mental rotation that is measurably unreliable — and one found
   coincidence usually pins the whole orientation for free.
5. **Remaining facts get a TWO-HYPOTHESIS test with a pre-registered
   observable** — write BOTH mirror readings and what each PREDICTS for
   one concrete pixel observable (material/void sequence along a line, an
   edge count, what a leader touches); only THEN read the observable off
   the image (magnified crop if one was supplied) and let it decide.
   Prediction before observation: collected afterwards, the observable
   bends to fit the favored reading.
6. **Have fresh readers answer the open questions when the host provides
   them** (buerli-ai: `delegate` with `agent: "perception", withImages:
true`) — a fresh reader has no build task in context, which is the
   measured differentiator. ONE question per reader, several readers
   fanned out in parallel in the same response (one question per reader →
   6/6 correct; seven questions in one reader → handedness wrong).
   Readers answer what is VISIBLE, nothing else: what a dimension MEANS,
   what is hidden, how deep a bore goes are USER questions — asked anyway,
   a reader fabricates confident detail. Reader disagrees with you ⇒ LOW
   CONFIDENCE, record it.
7. **Write the verdicts + evidence into the record**, then freeze it.

Bounds on the whole phase:

- The supplied image(s) ARE the evidence base. Do not manufacture crop
  batteries — self-cropping runs took 25–50 min against ~12 for plain
  reads, with no accuracy gain.
- **Mechanical plausibility is a PRIOR, not evidence** — it describes
  typical parts, not this part (real parts DO have ribs meeting curved
  walls and cuts opening off the plate). Tie-breaker when every image
  channel is silent; never an override of a callout reading.
- **"Symmetric about a plane" exempts nothing** — symmetry about one
  plane says nothing about asymmetries along the other axes, and the
  feature at risk is usually on one of those.
- **Never invent geometry to explain a reading.** A reader answer that
  implies an otherwise unevidenced feature (a gap, a slot, a cut) is a USER
  question, not a record fact — one misread "ring gap" became an invented
  cut that every probe then validated.
- Every dimension, axis and relation must be traceable to something you
  can point at in THIS image. "I recognize this part" is recall, not
  reading — the remembered variant differs.

**Stopping rule — bounded inquiry, then ASK or DECLARE.** One
discriminating observation plus the reader round is the whole budget per
fact. Not settled ⇒ the fact is UNDECIDABLE from the input, which is a
RESULT, not a failure:

- **Interactive host: ASK the user.** Once, all open questions batched,
  each with your best reading as the default so a one-word reply unblocks
  you ("I read the 70 as centre→far end; the bore looks through — confirm
  or correct?"). Every handedness fact goes into the batch
  UNCONDITIONALLY — confidence does not filter the list. One batched
  question is the fast path; the wrong part is the stall.
- **Headless: DECLARE.** Record both readings, choose by channel rank
  (callout > silhouette), state which channel decided and what would
  overturn it.

Either way stop looking: re-cropping, upscaling and re-reading past this
point add no information — elaborate analysis is what an agent does
INSTEAD of asking.

## Build

Implement the record (Part II discipline per stage). The record is frozen —
if mid-build evidence contradicts it, stop and re-derive the record from the
reference, don't patch silently.

## Final gate — four steps, in order

1. **Matched-view renders**: one snapshot per reference view, oriented like
   the reference (snapshot supports named views AND `{azimuth, elevation}` —
   match the iso's octant; front/top/right for orthographic views). A
   comparison against an arbitrary ISO is not a comparison. For a multi-view
   technical drawing, render `drawing: '<the reference's method>'`: the same
   layout in line style with hidden edges dashed, so the comparison covers
   the hidden lines too — they carry the internal structure (through vs
   blind holes, bosses vs bores, hollow vs solid).
2. **Mirror check (forced choice) — UNCONDITIONAL, judged against the
   IMAGE.** Reference image in ⇒ pair render and independent verdict out,
   every time. There is no precondition to assess — not "the part looks
   symmetric", not "I am confident": each self-granted exemption has
   shipped a mirrored part. Procedure: FIRST write the reference's answer
   in image-space terms ("in the REFERENCE image, the opening is on the
   upper-RIGHT of the tower") — committed before any render can steer the
   reading. THEN render the matched view and its mirror as ONE image —
   `sheet: [matchedView, sameViewWithNegatedAzimuth]` gives side-by-side
   panels labeled A | B — answer the committed question for each panel
   independently, and pick the matching panel. Judge against the reference
   IMAGE, never against your own record: a mirrored record validates
   itself. A reader that reports missing or incomplete images is a FAILED
   gate — fix the handover and re-run it; judging the comparison yourself
   is not a fallback. Best: hand reference + pair
   sheet to a fresh reader with the
   single question "which panel matches the reference?" (buerli-ai:
   `delegate` with `agent: "perception", withImages: true, withSnapshots:
true`). If the MIRROR panel matches, your reading was flipped: fix the
   model, don't re-argue the record.
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
- Unchanged volume after a "successful" SUBTRACTION (maxLevel 31) = the boolean left a sheet
  body; a section snapshot still looks cut. Assert the expected drop after every subtraction.
- N patterned cuts → missing instances show up as `+1/N` volume steps.
- Tolerance: planar solids match exactly; curved solids deviate slightly from the analytic
  value (cylinder ≈ −0.002 %, sphere ≈ +0.014 %) — that is the kernel's volume integration,
  not a modeling error. Compare with a relative tolerance around 0.05 %.
- Null mass properties on a body that existed a step earlier = the body was
  destroyed (e.g. a failed or degenerate boolean).
- Photo-input case: no absolute volume to check — verify RATIOS (feature
  size vs overall extent) and counts against the image instead.

## Tier 2 — bounds / bounding box (position/extent claims)

There is no v1 bounds method. In any script, bound the CURRENT solids only:

```js
const cap = await api.inspect.capture()
const b = api.inspect.graphicBounds(cap, api.inspect.currentSolids(cap))
// → { min: [x,y,z], max: [x,y,z], approximate: true }  (tessellation; instance transforms not applied)
```

The graphic still carries consumed bodies (the box before a boolean, the hole cylinders): bounding every
container gives a box that is too big — a half plate 60×80×20 read as (0,0,−1)–(120,80,21) unfiltered.

In buerli clients `structure.calculateProductBounds(rootOrPartId)` (POSITIONAL args) returns
`{ center, min, max, radius }` (radius −1 = empty).

Extent = `max − min`. Use for "the part is 80 long", "centered on origin",
"the cut went through".

## Tier 3 — brep probes (exact feature positions)

Prove a specific feature exists where the math says it should:

```js
const ids = await api.v1.part.getGeometryIds({ id: partId, cylinders: [{ positions: [[0, r, z]] }] })  // a point ON the face; avoid the +X seam line [r, 0, z]
const pos = await api.v1.part.getGeometryPositions({ elems: [...] })
```

- Entries for types with no match come back as **empty arrays (truthy!)** —
  flatten and keep numbers: `ids.flat().filter(x => typeof x === 'number')`
  ([part/getGeometryIds](../references/part/getGeometryIds.md)).
- **A full circle is one closed edge; a rim another cut interrupts (a keyway,
  a cross hole) is several.** To collect such a rim, sweep candidate edges by
  position instead of assuming one id.
- Cylindrical faces (`cylinders`) are often easier to find than their rim
  arcs — probe the face radius/axis instead.
- A probe point comparison: compute the expected coordinate analytically,
  measure, assert the distance ≈ 0 (float precision: expect ≤1e-6 of the
  model scale).

## When to verify

| Situation                                         | Verification                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Single simple feature (a box, one fillet)         | none — the returned id + no error is enough                       |
| Multi-feature constructive build                  | Tier 1 after the final boolean, Tier 3 on one or two key features |
| After every `updateExpression` regen              | Tier 1 + Tier 3 on the changed feature                            |
| Boolean/pattern/slice that could silently mis-cut | Tier 1 before AND after (delta check)                             |
| Claim about position/alignment/extent             | Tier 2 or Tier 3 — never from the rendered view alone             |
| Input reference present                           | ALL of Part I, with the record's facts probed via Tier 3          |

Verification failures are findings, not annoyances: when measurement and
expectation disagree, stop and investigate — one of them is wrong, and it is
not always the model.

## Tessellation trap (graphic-based probes)

The mesh you probe is faceted at the drawing's chord tolerance — **default
`chordHeightTol 0.1` in MODEL UNITS** (worker-global). Consequences (both bit an agent):

- On features smaller than ~50× the tolerance (an inch-model seat arc r=0.101
  vs tol 0.1!), faces emit endpoint-only vertices — a probe can conclude a
  cut is MISSING when it is present. Mesh vertices may sit ~1e-5+ off the
  exact surface even when fine.
- Cure 1 (exact): probe the BREP, not the mesh — `getGeometryIds` +
  `getGeometryPositions` return analytic positions.
- Cure 2 (mesh): `common.setFacetingParameters({ angleTol: 0, chordHeightTol:
<bboxDiag/3000> })` (the payload re-tessellates, no recalc), probe, then RESTORE the previous values —
  the setting persists worker-globally across sessions.
- Snapshots are already safe: the renderer applies adaptive fine faceting for
  the image and restores the params (`quality: 'fast'` opts out).

## Related

[part/calculateMassProperties](../references/part/calculateMassProperties.md) ·
[part/getGeometryIds](../references/part/getGeometryIds.md) ·
[recipes/parametric-part](parametric-part.md) ·
[recipes/pattern-then-subtract](pattern-then-subtract.md) ·
[recipes/constrained-sketching](constrained-sketching.md)
