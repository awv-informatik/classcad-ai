# Prompt — parametric double-strand sprocket with hub collar (paste into buerli-ai)

Build a **double-strand ANSI #35 roller-chain sprocket with a hub collar on one
side** (catalog style D35B13, stainless look): 13 teeth, 3/8" pitch, two toothed
plates with the chain-plate clearance gap between them, hub collar behind the
rear plate, 5/8" bore with keyway, one radial set screw, chamfered bore rims.

I want a **parametric MODEL, not a parametrically generated model**: every
driving value lives in the model as an expression, every sketch is constrained
and dimensioned against those expressions, and changing an expression
regenerates the finished body. Do not compute numbers outside the model and
hardcode them into geometry — if a number appears in a sketch dimension or
feature parameter, it must be an `@expr.` reference. Declare relationships
(tangency, coincidence) as constraints and let the solver lay out the sketch.

## Units

Model in mm. Define `inchF = 25.4` as an expression; the catalog values below
are inches — every inch-valued expression multiplies by `inchF` exactly once.

## Base expressions (create ALL of these)

- `inchF = 25.4`
- `teeth = 13`
- `Pin = 0.375` (chain pitch, in), `Drin = 0.2` (roller diameter, in)
- `t2in = 0.162` (multi-strand plate thickness, in)
- `Kin = 0.399` (transverse strand spacing, plate-center to plate-center, in)
- `boreIn = 0.625`, `hubProjIn = 0.5` (hub projection beyond the rear plate, in)
- `hubDiaIn = 1.109375` (max hub for 13T = 1 7/64")
- `reliefDiaIn = 1.109375` (between-strand spacer diameter = max hub)
- keyway for a 5/8" shaft: `kwWin = 0.1875` (3/16), `kwDin = 0.09375` (3/32)
- `screwDin = 0.25` (set screw for the 5/8–7/8 bore band)
- `chamfIn = 0.03` (bore rim chamfer)

## Derived expressions (create as expressions referencing the base ones)

Tooth form per ASME B29.1 Type II — the full tangential form with seating,
working and topping ARCS (not straight flanks). All inches. Note: ANGLE
dimensions cannot bind `@expr` — encode angular facts through distances and
tangency constraints instead.

- `pAng = C:PI / teeth`
- `RpIn = Pin / (2 * sin(pAng))` (pitch radius)
- `RseatIn = 0.5025 * Drin + 0.0015` (roller seating radius)
- angles used in derivations (do not create ANGLE dims from them):
  `A = 35 + 60/teeth` degrees, `B = 18 - 56/teeth` degrees
- `MIn = 0.8 * Drin * cos(A)`, `TIn = 0.8 * Drin * sin(A)`
- `EIn = 1.3025 * Drin + 0.0015` (working-curve radius; equals 0.8·Dr + Rseat
  exactly — the seating↔working junction is TANGENT by construction, so enforce
  it as a TANGENT constraint, never as computed coordinates)
- `WIn = 1.4 * Drin * cos(pAng)`, `VIn = 1.4 * Drin * sin(pAng)`
- `blankODIn = 2*RpIn + Pin/2` (blank OD = pitch diameter + P/2 — each tooth tip
  carries a small flat)
- `RcapIn = blankODIn/2 + 0.3*Pin` (cutter cap radius, outside the blank)
- `rootRIn = RpIn - Drin/2`
- body: `gapIn = Kin - t2in` (clearance between the strands),
  `LTBin = 2*t2in + gapIn + hubProjIn` (overall length through bore),
  `toothAngle = 2*C:PI/teeth`
- tip taper: `taperR0In = blankODIn/2 - Pin/2`, `taperR1In = blankODIn/2 + 0.1`,
  `taperDzIn = (taperR1In - taperR0In)/4` (1:4 slope, encoded in the graph)
- set screw position: `screwVin = 2*t2in + gapIn + hubProjIn/2` (centered on the
  hub band)

## Build

1. **Blank as a constrained revolve section** (one sketch, axis = X): the
   cross-section staircase in (axial, radial) — front plate `[0 .. t2]` at
   `blankOD/2`, spacer `[t2 .. t2+gap]` at `reliefDia/2`, rear plate
   `[t2+gap .. 2·t2+gap]` at `blankOD/2`, hub collar `[2·t2+gap .. LTB]` at
   `hubDia/2`, closed along the axis. Every segment length and radius is a
   sketch DIMENSION bound `@expr.`; revolve about the axis.
2. **One tooth-space cutter as a CONSTRAINED sketch** — the heart of the model.
   Construction skeleton: fixed origin, space centerline, pitch-radius
   construction circle. Profile (8 entities; sprocket center at origin, space
   centerline along +y):
   - seating arc of radius `Rseat`, its center `a` constrained ONTO the pitch
     circle at distance `Rp` from the origin (constrained, not placed)
   - per side: working arc of radius `E` centered at `c = a ± (M, T)`, meeting
     the seating arc at `x = a ∓ Rseat·(cos A, sin A)` — make the junction a
     COINCIDENT + TANGENT constraint pair
   - per side: topping arc centered at `b = a ∓ (W, V)`; leave its radius
     UNdimensioned — the published closing formula is slightly
     self-inconsistent, so let tangency/coincidence at the working-arc end
     define the radius (it emerges from the solve)
   - two radial cap lines through the origin out to `Rcap`, closed by a cap
     arc — the profile must close OUTSIDE the blank OD so the cut is clean
   - every driving size is a sketch DIMENSION, `@expr`-bound wherever the
     engine supports it; tell me about any dimension that could not be bound
     and why
3. **Pattern & cut**: extrude the cutter SYMMETRIC through both plates (the
   spacer diameter lies below the root circle, so a through-cut leaves it
   untouched). `circularPattern` around X with `count: '@expr.teeth'`,
   `angle: '@expr.toothAngle'`, and **`merged: 1`** — an unmerged pattern
   silently freezes its count against later regeneration. Remove all tooth
   spaces together with the other tools in ONE subtraction at the end.
4. **Tip tapers**: conical relief on all four plate faces — constrained
   triangular sections (radial `taperR0 → taperR1`, lateral `taperDz`),
   revolved about the axis as cutting tools.
5. **Bore, keyway, set screw**: bore Ø `boreIn` through everything as a
   constrained sketch circle with an `@expr` diameter dimension; square keyway
   `kwW × kwD` above the bore through the full length; one radial set-screw
   hole Ø `screwDin` at axial position `screwVin`, reaching the bore.
6. **One subtraction** of every tool, then a **bore chamfer** of `chamfIn` on
   both bore rims. Careful: a subtracted cylinder's rims are split by the seam
   AND the keyway into several arcs — collect ALL rim arcs (verify each by
   radius and position) and chamfer them in one feature bound to the chamfer
   expression, then check the chamfer ring runs the whole way around.
7. Name the body `D35B13SS` and give it a stainless appearance.

## Rules for staying parametric

- Parametrics must flow through SKETCH DIMENSIONS and merged patterns — never
  through feature parameters of consumed boolean tools (those freeze or corrupt
  on regeneration).
- Large parameter jumps can flip constraint-solver branches: when changing the
  tooth count, step it one tooth at a time with a recalc between steps.
- After creating each sketch, confirm its `planeId` actually resolved — a
  planeless sketch accepts constraints and dimensions silently and regenerates
  nothing.

## Verify, then prove it is parametric

Verify the finished body numerically (root radius = `Rp − Dr/2`, tip flat at
`blankOD/2`, bore rim, hub face, plate positions at `t2+gap` and `2·t2+gap`;
volume against an independent estimate). Then demonstrate regeneration and
report the measured numbers for each step:

1. `boreIn 0.625 → 0.75` via updateExpression — the bore rim and the chamfer
   ring must land exactly at the new radius.
2. `hubProjIn 0.5 → 0.7` — hub face and set-screw position must cascade.
3. `teeth 13 → 15`, stepwise — the merged pattern must regenerate to 15 tooth
   spaces and the volume must match the 15-tooth form.
4. Confirm ONE solid body remains after all regenerations (no orphan slivers).
