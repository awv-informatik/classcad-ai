# E2E benchmark prompt — D35B parametric sprocket (variant B: TRUE parametric model)

The SAME prompt is given verbatim to every host (root agent harness, buerli-ai
panel, ClassCAD MCP). Host-neutral: it never says which tools to use. Acceptance
criteria at the bottom are checked by the examiner, not the agent.

Variant B means: a **parametric MODEL**, not a parametrically **generated** model.
Every driving value lives in the model as an expression; every sketch is
constrained and dimensioned against those expressions; changing an expression
regenerates the finished body. A build whose numbers were computed outside the
model and hardcoded into geometry fails this benchmark regardless of shape.

---

Build a **double-strand ANSI #35 roller-chain sprocket with a hub collar on one
side** (Martin style D35B13, stainless): 13 teeth, 3/8" pitch, two toothed
plates with the chain-plate clearance gap between them, hub on the back side,
5/8" bore with keyway, one radial set screw, chamfered bore rims.

## Units

Model in mm. Define `inchF = 25.4` as an expression; catalog values are inches —
every inch-valued expression multiplies by `inchF` exactly once. Nothing derived
may be hardcoded downstream: **if a number appears in a sketch dimension or
feature parameter, it must be an `@expr.` reference.**

## Base expressions (create ALL of these in the model)

- `inchF = 25.4`
- `teeth = 13`
- `Pin = 0.375` (chain pitch, in), `Drin = 0.2` (roller diameter, in)
- `t2in = 0.162` (multi-strand tooth/plate thickness, in)
- `Kin = 0.399` (transverse strand spacing, center-to-center, in)
- `boreIn = 0.625`, `hubProjIn = 0.5` (hub projection beyond the rear plate, in)
- `hubDiaIn = 1.109375` (Martin max hub for 13T = 1 7/64")
- `reliefDiaIn = 1.109375` (between-strand spacer diameter = max hub)
- keyway (ASME B17.1 for 5/8" shaft): `kwWin = 0.1875` (3/16), `kwDin = 0.09375` (3/32)
- `screwDin = 0.25` (set screw for the 5/8–7/8 bore band)
- `chamfIn = 0.03` (bore rim chamfer)

## Derived expressions (as expressions referencing the base ones — not computed by you)

Tooth form, ASME B29.1 Type II (all inches; angles: the engine's ANGLE
dimensions cannot bind `@expr` — encode angular facts through distance/tangency
schemes instead):

- `pAng = C:PI / teeth`
- `RpIn = Pin / (2 * sin(pAng))` (pitch radius)
- `RseatIn = 0.5025 * Drin + 0.0015` (roller seating radius)
- `Aang = (35 + 60/teeth)` degrees, `Bang = (18 - 56/teeth)` degrees (used in
  the derivations below; do not create ANGLE dims from them)
- `MIn = 0.8 * Drin * cos(Aang)`, `TIn = 0.8 * Drin * sin(Aang)`
- `EIn = 1.3025 * Drin + 0.0015` (working-curve radius; = 0.8·Dr + Rseat exactly
  → seating↔working tangency is a geometric fact, enforce it as a TANGENT
  constraint, never as coordinates)
- `WIn = 1.4 * Drin * cos(pAng)`, `VIn = 1.4 * Drin * sin(pAng)`
- `blankODIn = 2*RpIn + Pin/2` (blank OD = PD + P/2 — each tip carries a small flat)
- `RcapIn = blankODIn/2 + 0.3*Pin` (cutter cap radius, outside the blank)
- `rootRIn = RpIn - Drin/2`
- body: `gapIn = Kin - t2in` (chain-plate clearance between the strands),
  `LTBin = 2*t2in + gapIn + hubProjIn` (overall length through bore),
  `toothAngle = 2*C:PI/teeth`,
  taper: `taperR0In = blankODIn/2 - Pin/2`, `taperR1In = blankODIn/2 + 0.1`,
  `taperDzIn = (taperR1In - taperR0In)/4` (the 1:4 tip-taper slope lives in the
  expression graph),
  `screwVin = 2*t2in + gapIn + hubProjIn/2` (set screw centered on the hub band)

## Build (single session; several staged scripts are encouraged)

1. **Blank as a constrained revolve section** (one sketch, axis = X): the
   cross-section staircase in (axial, radial) — front plate `[0 .. t2]` at
   `blankOD/2`, spacer `[t2 .. t2+gap]` at `reliefDia/2`, rear plate
   `[t2+gap .. 2·t2+gap]` at `blankOD/2`, hub collar `[2·t2+gap .. LTB]` at
   `hubDia/2`, closed along the axis. Every segment length/radius a sketch
   DIMENSION bound `@expr.`; revolve about the axis.
2. **One tooth-space cutter as a CONSTRAINED sketch** — the core of this test.
   Construction skeleton: fixed origin, space centerline, pitch-radius
   construction circle. Profile (8 entities, sprocket center at origin, space
   centerline along +y):
   - seating arc of radius `Rseat`, its center `a` constrained ONTO the pitch
     circle (distance `Rp` from origin — constrained, not placed)
   - per side: working arc of radius `E` centered at `c = a ± (M, T)`, meeting
     the seating arc at `x = a ∓ Rseat·(cos A, sin A)` — the junction is a
     COINCIDENT + TANGENT constraint pair, not a computed point
   - per side: topping arc centered at `b = a ∓ (W, V)`; its radius is
     **emergent** (leave it undimensioned): the published F formula is ~1.4%
     self-inconsistent — tangency/coincidence at the working-arc end `y` is
     what defines it
   - two radial cap lines through the origin out to `Rcap`, closed by a cap arc
     — the profile must close OUTSIDE the blank OD so the cut is clean
   - every driving size a sketch DIMENSION, `@expr`-bound wherever the engine
     supports it; list any dimension that could not be bound and why
3. **Pattern & cut**: extrude the cutter SYMMETRIC through both plates (the
   spacer diameter is below the root circle — a through-cut leaves it
   untouched), `circularPattern` around X with `count: '@expr.teeth'`,
   `angle: '@expr.toothAngle'`, **`merged: 1`** (an unmerged pattern silently
   freezes its count against later regeneration), then remove all tooth spaces
   with ONE subtraction together with the other tools below.
4. **Tip tapers**: conical relief on all four plate faces — constrained
   triangular sections (radial `taperR0 → taperR1`, lateral `taperDz`), revolved
   about the axis as cutting tools.
5. **Bore, keyway, set screw**: bore Ø `boreIn` through everything as a
   constrained sketch circle (`@expr` diameter); square keyway `kwW × kwD` above
   the bore through the full length; one radial set-screw hole Ø `screwDin`
   centered at axial position `screwVin`, reaching the bore.
6. **One subtraction** of every tool, then **bore chamfer** `chamfIn` on both
   bore rims — collect ALL rim arcs (a subtracted cylinder's rims are seam- and
   keyway-split into multiple arcs; chamfering one arc per rim is the classic
   partial-ring failure), chamfer them in one feature bound `@expr.chamfMm`.
7. Name the body `D35B13SS`, stainless appearance.

## Rules that make it variant B

- Parametrics flow through SKETCH DIMENSIONS and merged patterns — never through
  feature parameters of consumed boolean tools (primitive params on consumed
  tools corrupt or freeze on regeneration).
- Large parameter jumps flip constraint-solver branches: apply tooth-count
  changes STEPWISE (13→14→15), one update per recalc.
- Verify each sketch actually has a live solver (a sketch whose `planeId` did
  not resolve accepts constraints and dimensions silently and regenerates
  nothing).

## Acceptance (examiner-checked)

| #   | Check            | Pass condition                                                                                                                                                                                 |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Expression graph | every base + derived expression exists in-model; no derived literal in any sketch dim                                                                                                          |
| 2   | Baseline probes  | root radius = `Rp−Dr/2`, tip flat at `blankOD/2`, bore rim at `boreIn/2`, hub OD face at `hubDiaIn/2`, strand-2 plate faces at `t2+gap` and `2·t2+gap` — each ≤ 1e-6" vs the expression values |
| 3   | Volume           | CAD volume vs an independent numeric model of the same spec within ±1%                                                                                                                         |
| 4   | Regen T1         | `boreIn 0.625 → 0.75` via updateExpression: bore rim exact at the new radius, chamfer full-ring at the new radius (16-azimuth check)                                                           |
| 5   | Regen T2         | `hubProjIn 0.5 → 0.7`: hub face and set-screw position cascade exactly                                                                                                                         |
| 6   | Regen T3         | `teeth 13 → 15` stepwise: pattern count live (15 spaces present), volume matches the 15T spec ±1%                                                                                              |
| 7   | Topology         | ONE solid body; no orphan slivers after regeneration                                                                                                                                           |
| 8   | Mirror/section   | sheet render (top + section) matches the spec silhouette; teeth aligned across both strands                                                                                                    |
