# Session: Sprocket Variant B — TRUE parametric model (constraints + expressions)

**Date:** 2026-08-10
**Task (ph + Kollege):** distinguish "parametrisch generiertes Modell" (variant session `2026-08-10_13-03-40_sprocket-martin35`) from "parametrisches Modell". Variant B = constraints + dimensions linked to expressions, regeneration IN the model. (Variant A = honest `solid.*` destructive port, separate session.)

## 01/01b/01c — feasibility probes

- **(01 c) Sketch-dim edits regenerate the CONSUMED boolean chain EXACTLY.** rect-sketch → extrusion tool → boolean subtract; `updateDimension` 20→40 → volume delta exactly 4000 mm³. The core premise of variant B holds.
- **(01 b/c) Feature params (`@expr`) on consumed boolean TOOLS CORRUPT on regen.** Cylinder tool `diameter:'@expr.D'`, D 20→30 after subtraction: volume changes by exactly ¼ of the expected annulus, geometry teleports to the plate edge (snapshot), stable across recalcs, **maxLevel 31 throughout**. With and without workCSys placement. → parametrics must flow through SKETCHES, not feature params of consumed tools.
- **(01 b) `@expr` in sketch dimensions WORKS and is LIVE** — contradicting the skill docs. → side quest.

## SIDE QUEST (ph): why did the skill claim "@expr not supported in dimensions"?

Archaeology: the claim traces to `2026-04-14_14-00-00_sketchDimension/11-expression-value.mjs` + `updateDimension/02,11` — all created their expression with the **malformed direct form** `part.expression({id, name, value})`. 01d proved on today's server: that form is a **silent no-op returning result=1/maxLevel=31** (getExpression → value null), and `@expr` on the resulting nonexistent expression produces exactly the historically recorded failure (error 51 "Couldn't set the value for dimension", geometry unchanged). With the correct `toCreate` form: binding works, LIVE, at creation AND via updateDimension (result 2). Still genuinely broken: ANGLE dims + @expr (maxLevel 51), `linkWithExpression` on dims ("Datamember value not found"), formula strings referencing expressions.

Old binary is gone (current build Jul 13) → "was it always supported" undeterminable; the recorded negative was unsound either way — **its fixture never existed**. Docs fixed (dimension.md, updateDimension.md, SKETCHING.md, expression.md gotcha), commit d1df8b3, TODO #181. Method lesson → memory: *verify the fixture before trusting a negative.*

## 02/02b/02c/02d — the constrained tooth-space sketch

Scheme (`_sketchB.mjs`): full ACA construction as 8 profile entities + construction skeleton (fixed origin, vertical axis line, blank-OD construction circle); 20 constraints (COINCIDENT chain, TANGENT root↔working — exact per ANSI, radial lines through origin, PL/PR on OD circle); **15 dimensions, every one `@expr`-bound** to an in-model expression graph that encodes the full ANSI derivation (`Rp = P/(2*sin(C:PI/teeth))`, `Mc = 0.8*Dr*cos(Aang)`, …). Topping radius intentionally UNdimensioned (emergent F_eff — the published F is ~1.4% inconsistent, see variant-gen GROUNDWORK).

Findings on the way:
1. **`sketch.getPositions` returns WORLD coordinates, not sketch-local.** On the Right plane, local (lx,ly) → world (0,−ly,lx). All prior training read positions on Top-plane sketches where local==world — never noticed. First "solve failure" (uniform ~2·Rp errors) was entirely this. 📌 getPositions.md.
2. **HD/VD point-pair dims are UNSIGNED and branch-keeping** (02b): order of geomIds irrelevant, solver keeps the seed's side, even seeded far off. 📌 dimension.md.
3. **From perturbed seeds, the solver lands the exact ANSI 21T layout**: all 13 tracked junctions/centers at error 0 (float-exact vs analytic) — except the two outer cap corners QL/QR (~1.5 mm, see "Q-slop" below).
4. **Large parameter jumps flip solution branches** (02c/02d): teeth 21→24 in ONE update moved a by ΔRp=4.5mm; the working-arc centers stayed near their old positions — which after the jump lie closer to the MIRROR branch (below a, |ac|=E−R exactly satisfied, all lgsState=1, nudges report result 2). **Not a server bug: a legitimate alternate solution of an under-oriented scheme** (unsigned dims cannot encode "c above a"). **Mitigation verified: STEPWISE application** (21→22→23→24) keeps the correct branch — every junction exact at each step. 📌 dimension.md/SKETCHING.md.
5. **Q-slop**: QL/QR alone carry 0.4–1.5 mm residual while all constraints report solved; outside the blank OD → provably irrelevant for the solid (cut region still closes beyond the material). Unexplained → TODO #183.

## 03 — full parametric sprocket + in-tree regeneration

Build (`_buildB.mjs`): expression graph (18 tooth-form + 13 body expressions) → constrained blank section (Top, 6 lines, 4 @expr dims) → revolve → constrained tooth sketch → extrusion tool (fixed generous span, deliberately NOT @expr) → circularPattern (count/angle @expr) → bore as constrained SKETCH circle (@expr diameter) + extrusion → constrained keyway rect → ONE subtraction. No taper/screws (scope; variant A has them).

| Test | Result |
|---|---|
| baseline 21T | root/tip/bore-rim exact (≤7e-16 in), volume vs MC 0.8% ✓ |
| **T1 bore 1.0→1.25** via `updateExpression` | **regenerates exactly** — bore rim at 0.625 err 0, volume ✓ 0.84% |
| **T2 hubProj 0.5→0.7** (blank-section dim) | **regenerates exactly** ✓ 0.77% |
| **T3 teeth 21→24 stepwise** | sketch morphs exactly (0.52mm = Q-slop only); root/tip/borerim at 24T-geometry all EXACT — the shape parametrics flow through pattern copies into the brep ✓ |
| T3 pattern count | ❌ with `merged: 0` — space #22@330° missing, volume +26%; `@expr` on the consumed unmerged pattern silently dead. **✓ with `merged: 1`** (rainer review, 2026-08-12): single-brep tool → subtraction independent of instance count → count/angle fully live (space #22 exists, volume 0.23% vs 24T-spec) |
| T4 explicit `openFeature`+`updateCircularPattern`(24) | ❌ unmerged: reports full success (31/31/31) and changes nothing. **✓ merged** |

Visual: `files/03-parametric-sprocket-after-regen-face-solid.png` — body regenerated to 24T geometry, but 21 frozen cut positions leave orphan sliver bodies at the rim (renderer colors = separate bodies).

## Conclusion — what "parametrisches Modell" means in ClassCAD today

(Rewritten 2026-08-12 after rainer's review corrected my `merged`-flag understanding.)

- **Everything driven by SKETCH DIMENSIONS is genuinely parametric through the whole consumed chain** (extrusion→pattern-copies→boolean→brep): form parameters, bore, keyway, hub, blank — live via `@expr`, exact to float precision, verified against an independent MC model.
- **Pattern count/angle are parametric too — IF the pattern is `merged: 1`** (single-brep tool; the subtraction is independent of the instance count, so `@expr` count/angle regenerate through the boolean — teeth 21→24 verified exact). My earlier "feature-level params of consumed tools are NOT parametric" conclusion was a `merged: 0` artifact: unmerged patterns DO freeze silently (and explicit updates no-op with success codes) — that narrower statement is the real trap.
- Primitive feature params on consumed tools remain hazardous (cylinder-diameter regen corrupts, ¼-annulus artifact) — route those through sketches.
- Branch-selection is the real cost of solver-driven parametrics: unsigned dims + minimal-motion = wrong branch on large jumps; **step the master parameter** (or harden the scheme with side-encoding facts).
- **The complete model is therefore fully in-tree parametric — including tooth count.**

## Nachtrag (ph): complete model — taper, set screws, bore chamfer added to B

ph asked for feature-parity in both variants. Added to B, all parametric: tip-taper cone cuts as **constrained triangles** (Top plane, dims `taperR0/R1/Dz` — `taperDz='(taperR1-taperR0)/4'` encodes the 1:4 slope in the expression graph), set-screw holes as constrained circles (Top +Z / Front +Y, `screwVmm` position cascades with hubProj!), and the **bore chamfer** as a `part.chamfer` feature (azimuth-sweep rim collection, `distance1: '@expr.chamfMm'`).

**War story (2h of misdirected bisection):** the Front-plane screw sketch refused ALL dimension values — batch, single, @expr AND plain numeric — with `"Couldn't set the value for dimension"`. Bisection chased solver-state ghosts (tooth-sketch Q-slop, origin-point collisions, dim-count limits, build order — five probe scripts, all subsets passed). Actual cause: **the builder's `planes` map had no `Front` entry → `planeId: undefined` → PLANELESS sketch → solver silently disabled**, which manifests as exactly this error on any dim with a value. The #1 documented trap, in a new disguise: I checked `sketch.create`'s maxLevel (31, happy) but never that the planeId I passed existed. 📌 sketch/create.md now lists the error signature.

**Complete-model results (all ✓, `files/03-parametric-sprocket-parametric-report.json`):** baseline root/tipcorner (at v0+P/8 — taper present)/borewall at ≤3e-7 in, volume vs MC (now incl. tapers+screws, chamfer allowance) 0.28%, chamfer full-ring 1e-5 mm. Regen: T1 bore→1.25 and T2 hubProj→0.7 exact — **and the chamfer feature FOLLOWS the regenerated bore topology: full-ring error 0 mm at the new radius, both tests.** Answer to the open question: edge-referenced downstream features (chamfer as tree tip) TRACK sketch-driven regeneration of the consumed chain — no dangling, no silent freeze. The screw position (`screwVmm = t1+hubProj/2`) cascaded correctly with T2. T3/T4 unchanged: sketch morph + root/tip/borewall exact at 24T; pattern count/angle frozen (known, TODO #182).

## Skill updates

d1df8b3 (side quest: @expr in dims + expression no-op gotcha) and this session's follow-up commit — getPositions world-coords, HD/VD semantics, consumed-feature param freeze/corruption warnings (boolean.md, circularPattern.md, expression-workflow.md). TODO #181 (no-op form), #182 (consumed-tool param regen corrupt/frozen), #183 (Q-slop).
