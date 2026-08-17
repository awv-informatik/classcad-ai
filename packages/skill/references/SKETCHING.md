# Sketching Guide — Reproducing Technical Drawings in ClassCAD

A practical guide for parsing 2D technical drawings and recreating them as ClassCAD sketches. Covers the full pipeline from dimension analysis through constraint-driven layout, trimming, and iterative evaluation.


## Sketch-plane local→world mappings (probed 2026-08-10)

`getPositions` returns WORLD coordinates. The standard planes map sketch-local (x, y) as:

| Plane | local x → | local y → | normal |
|---|---|---|---|
| Top | +X | +Y | +Z |
| Front | +X | **−Z** | +Y |
| Right | **+Z** | **−Y** | +X |

`arcByCenter isClockwise: true` = math-NEGATIVE sweep in local coordinates on all three planes. Mirrored arcs traversed in reverse keep the SAME cw flag (the mirror flips the sweep, the reversal flips it back).

## The Method

**Don't hand-compute the layout — and don't assume the drawing is an outline.** Technical
drawings vary: some show a single trimmed profile, most mix COMPLETE features (full circles
with Ø callouts, centerlines, center marks) with TRIMMED remainders (partial arcs with R
callouts). Classify first, reconstruct the curves AS DRAWN, let the solver lay them out from
constraints and dimensions, and trim only what the drawing shows trimmed — or when deriving
a solid profile as a separate, explicitly-requested artifact.

```
0. Classify → 1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Constrain & Dimension → 5. Trim (conditional) → 6. Evaluate
```

**The sketch is a conditioned model, not a coordinate dump.** Analysis (Steps 1–2) tells you the drawing's dimension *scheme*; constraints and dimensions (Step 4) hand that scheme to ClassCAD so the solver computes the layout. Hardcoding every coordinate works for a one-shot reproduction, but the result can't adapt — change one value and nothing follows. A constrained sketch re-solves (verified: re-dimensioning a boss Ø45→Ø60 moved its tangent fillet to the new exact position automatically).

---

## Step 0 — Classify the Drawing and the Deliverable

Two questions before any analysis:

1. **What is the deliverable?** Reproducing the DRAWING as drawn is the default. A closed,
   extrudable profile is a DIFFERENT artifact — derive it from the finished sketch in a
   separate rim-trim step (Step 5), and only when a solid is actually requested.
2. **Per curve: complete or partial?** Walk every curve in the image. If you can trace the
   full curve in the drawing, create the full curve. If only a portion is drawn, it is the
   remainder of a trimmed shape — chain or trim it.

**When the method's expectation and the drawing image disagree, the drawing wins — it is the
spec.** Stop and re-classify instead of making the drawing fit the method. This is the
drawing-side mirror of the snapshot-vs-data rule. Past failure (2026-07-02, robot-head):
closed Ø5.6 eye circles were converted into boundary arcs by force-applying a trim-everything
method — the image plainly showed complete circles.

---

## Step 1 — Analyze the Technical Drawing

Read the drawing systematically. Don't start coding until you've identified every annotation.

### What to extract

| Category | What to look for |
|----------|-----------------|
| Diameters (Ø) | Through-holes, bores, bosses. "3×Ø17" = 3 instances of the same feature |
| Radii (R) | Profile arcs, fillets, transitions. "2× R.750" = 2 instances |
| Linear dimensions | Horizontal, vertical, offset distances between features or datums |
| Angles | Between construction lines, axes, features |
| Center marks (+) | Crosshairs indicate circle/arc centers — count them |
| Centerlines (dashed) | Construction geometry — horizontal, vertical, angled reference axes |
| Concentric features | Multiple annotations at the same center |

### Cross-reference dimensions

Don't treat dimensions independently. The real value is in **cross-referencing** — using one dimension to derive a position, then checking it against another. When multiple independent dimensions chain together to produce the same result, you've found the correct interpretation:

```
angle + horizontal distance → trig → vertical offset
vertical offset + radius → matches a third dimension ✓
```

If a dimension doesn't fit, the interpretation is wrong. Keep trying until all dimensions are mutually consistent.

### Reading technical drawings — common conventions

- **Ø vs R**: Ø is diameter (divide by 2 for radius). R is radius directly.
- **Multiplier prefix** ("3×"): means 3 instances of the same feature, not a multiplication.
- **Dimension reference points**: a distance may measure to a feature center, a bounding box edge, a tangent point, or a datum surface. Cross-referencing resolves which.
- **Feature-locating dimensions**: distances from a datum to a feature CENTER (hole center, boss center) are standard. Not all dimensions go edge-to-edge.
- **Tolerance and resolution**: when reading from images, similar-looking numbers (28 vs 38) and nearly-equal concentric circles can be ambiguous. When uncertain, ask.
- **Units**: check for unit indicators (mm, in). If absent, context clues help — dimensions like 5.804 suggest inches; dimensions like 49.73 suggest millimeters.

---

## Step 2 — Build the Dimension Checklist

Before writing any code, create a checklist. Every dimension annotation in the drawing gets a row:

```markdown
- [ ] D1: Ø38 — DIAMETER — [hub outer circle] — hub bore
- [ ] D2: 48 — HORIZONTAL_DISTANCE — [hub center → boss center] — boss position
- [ ] D3: 14° — ANGLE — [arm axis ↔ horizontal centerline] — arm angle
...
```

**Format**: `[ ] <id> <value> — <type> — [<anchors: from → to>] — <what it controls>`

**Record anchors exactly as the drawing measures them** (eye center → jaw edge, slot bottom →
center mark). The same references must be used when the dimension entity is created in Step 4
— deciding the anchors here, during analysis, prevents improvising constraint-equivalent
substitutes later.

This checklist serves three purposes:
1. **Completeness** — forces you to account for every annotation before coding
2. **Evaluation gate** — after building, check each box only when the placed geometry matches
3. **Iteration tracker** — unchecked items tell you exactly what's still wrong

---

## Step 3 — Recognize the Original Shapes

**Complete curves stay complete.** A circle drawn closed (Ø callout, both sides visible in
the image) is a complete entity — create it whole and connect adjacent profile curves to it
with COINCIDENT-endpoint-on-curve + TANGENT (the junction-on-a-full-circle pattern in
`sketch/constraint.md`), never by converting it to an arc.

**For the curves Step 0 classified as PARTIAL, what you see is not what was drawn.** A
partial arc is the result of trimming a simpler, natural shape — a full circle or line — at
intersection or tangency points. An organic-looking contour is often just a handful of
overlapping circles with interior segments removed.

If you can recognize those original shapes BEFORE trimming, reconstruction is
straightforward: place the shapes, then trim. Trying to trace the final profile directly
means working backwards, and errors compound.

### How to see through the trim

- **Center marks (+)**: every crosshair is the center of a circle or arc. Count them — that's your shape count.
- **Radius annotations (R)**: each R value corresponds to a circle. R1.750 means a full circle of radius 1.750 exists, and only a portion survived trimming.
- **Diameter annotations (Ø)**: through-holes and bosses — typically complete circles (untrimmed).
- **Tangent transitions**: where two curves meet smoothly, two shapes are tangent at that point. The visible arc is the trimmed remainder of each.
- **Fillet radii**: small R values at junctions are small circles tangent to both adjacent shapes.
- **Straight edges between curves**: tangent lines connecting two circles. The line is tangent to both.

### Decompose into natural shapes

Before coding, list every original shape:

| Visible feature | Original shapes |
|----------------|----------------|
| Oblong / slot | 2 circles (rounded ends) + 2 tangent lines (straight sides) |
| Oblong with inner slot | 4 circles (2 outer + 2 inner at same centers, different radii) + tangent lines |
| Smooth body contour | 1–2 large circles, trimmed to arcs |
| Boss with hole | 2+ concentric circles |
| Arm / extension at angle | End circles + waist circles + fillet circles at transitions |
| Fillet between features | 1 small circle tangent to both adjacent shapes |
| Triangular plate | 3+ circles at vertices + tangent lines between them |

### Place full shapes first, trim later

Don't draw trimmed arcs or hand-compute tangent points upfront. Place every circle and line at its full extent — rough/nominal positions are fine where exact coordinates aren't known, because Step 4's constraints and dimensions drive the solver to the exact layout:

```js
await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r })
```

**The sketch MUST be created with `planeId`** (`sketch.create({ id: partId, planeId })`). Without it the constraint solver is silently disabled — constraints and dimensions are accepted (maxLevel 31, IDs returned) but never enforced, which makes the whole of Step 4 dead weight. This is the #1 trap (see `sketch/create.md`).

**Leave the `gen*` auto-constraint flags ON (the defaults)** when you rely on autos to wire
the profile. Auto-incidence wires endpoint-matching geometry together (`Auto_Coinc`),
auto-H/V locks axis-aligned lines. That wiring is what lets a later dimension edit move the
whole connected profile instead of tearing it: a gen-ON rectangle survives a width change
closed; a gen-OFF one stretches one line and leaves the rest behind (verified 2026-06-10).
Disable a flag selectively only when it would fight the design intent — e.g.
`genVertAndHoriz: false` for a line drawn axis-aligned that will be dimensioned to an angle,
or `genTangency: false` when overlapping skeleton circles must stay independently placeable
until trimming.

**Fully explicit scheme (the conditioned-reproduction workflow): prefer autos OFF, and know
the failure mode.** With exactly-computed seeds + every tangency/coincidence created
explicitly, autos are pure duplicates. Verified on a 19-curve build (mounting-plate,
2026-07-02): duplication itself is harmless — autos ON and OFF both solve rough→exact at
2.8e-14 **when the explicit wiring is consistent with the seeds**. The danger: autos wire
junctions FROM THE SEED GEOMETRY; your explicit constraints wire them from your bookkeeping.
If those disagree (classic bug: mirrored arcs whose start/end roles got swapped, wired by a
side-uniform loop), the two constraint sets contradict — and `DoSolve` does not just flag a
loser, it DIVERGES GLOBALLY: batches return 51 with `CalcBulges radius too small` /
`SetSE NullMem`, small arcs collapse to radius 0, and every later dimension refuses its value
(even for satisfied, unrelated subgraphs). With autos OFF the same bookkeeping bug is benign:
the explicit set alone is solvable, the solver quietly slides the mis-wired arcs into the
role-swapped layout, and the numeric readback catches the few-mm displacement. That's the
argument for `genIncidence/genTangency/genVertAndHoriz: false` in fully explicit builds — one
source of truth turns a catastrophic wreck into a visible, diagnosable offset.

This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix the layout scheme (anchors, dimensions) before proceeding.

---

## Step 4 — Constrain & Dimension — let the solver lay out the sketch

Constraints and dimensions are ACTIVE. On a `planeId` sketch the solver enforces them immediately, physically moving and resizing geometry (all verified 2026-06-10: COINCIDENT snaps points, TANGENT moves to exact tangency, HORIZONTAL rotates preserving length, `DIAMETER value: 45` resizes an r=20 circle to r=22.5 at creation, HD/VD dimensions land a circle center on exact offsets). Declare the drawing's relationships and values; don't hand-compute what the solver can derive.

### Order of operations

1. **Anchor the datum** — `FIXATION` on reference geometry first; without an anchor the solver chooses what to move. Place the datum point EXACTLY at its drawing coordinates before fixing — FIXATION freezes the current position, it doesn't know where the point "should" be. One exactly-placed fixed point per sketch is enough; everything else can be seeded rough. To lock a line completely, fix its two **endpoints** individually: FIXATION on the line itself locks position/direction but NOT length — the solver will happily stretch a "fixed" line to satisfy a COINCIDENT or EQUAL_LENGTH elsewhere (verified).
2. **Relate** — COINCIDENT (connect), TANGENT (tangency), CONCENTRIC, PARALLEL / PERPENDICULAR, HORIZONTAL / VERTICAL, SYMMETRY (axis FIRST in geomIds). Full tables in `sketch/constraint.md`.
3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` binds linear/radial dims to expressions LIVE (updateExpression → sketch re-solves; verified 2026-08-10); ANGLE dims reject `@expr`.

### One annotation = one dimension entity

Every row of the Step 2 checklist must exist in the sketch as a DIMENSION, anchored to the
SAME references the drawing uses (eye center → jaw edge, not a constraint-equivalent datum
point). Redundant annotations are still annotations: create them as driven dims (no `value`)
— they double as verification readouts. If the drawing measures to something that isn't
geometry (a center mark, a virtual point), materialize the reference first (sketch point +
constraints — see the center-mark pattern below). Encoding an annotation only implicitly (a
coincidence that happens to produce the value) is NOT a reproduction of the drawing's
dimension scheme. Past failure (2026-07-02, robot-head): three annotations (slot width 3,
3.5-to-center, 8 eye-to-jaw) existed only implicitly or re-anchored, and the review bounced.

### Worked example — the solver does the tangent math

Two Ø45 bosses 38 apart joined by an R10 waist fillet. Nobody computes the fillet center — drop it in roughly on the correct side and constrain:

```js
const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [41, 40, 0], radius: 20 })).result
const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [79, 40, 0], radius: 20 })).result
const p1 = (await api.v1.sketch.getPoints({ id: c1 })).result.centerId
const p2 = (await api.v1.sketch.getPoints({ id: c2 })).result.centerId
await api.v1.sketch.constraint([                          // datum
  { id: skId, type: 'FIXATION', geomIds: [p1] },
  { id: skId, type: 'FIXATION', geomIds: [p2] },
])
await api.v1.sketch.dimension([                           // drawing values
  { id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 },
  { id: skId, type: 'DIAMETER', geomIds: [c2], value: 45 },
])
const cf = (await api.v1.sketch.circle({ id: skId, centerPos: [58, 60, 0], radius: 8 })).result // rough!
await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [cf], value: 10 })
await api.v1.sketch.constraint([
  { id: skId, type: 'TANGENT', geomIds: [cf, c1] },
  { id: skId, type: 'TANGENT', geomIds: [cf, c2] },
])
// fillet center solved to (60, 66.367594) — exact to 15 significant figures
```

Seed rough geometry on the correct SIDE of the intended solution (here: above the waist) — among valid solutions the solver takes the nearest/minimal-motion one. Circle–circle TANGENT solves to external tangency (center distance = r1 + r2).

**Rough ≠ sloppy:** seeds must still be valid geometry. `arcByCenter` rejects arcs whose endpoints aren't equidistant from the center (zero tolerance) — generate arc seeds from center + radius + two angles, and put the roughness into those values, not into hand-typed endpoint coordinates.

### Chain vs trim — pick by topology knowledge

- **Profile topology known** (you can list the arcs/lines and their adjacency — the normal case after Step 1 analysis): build the closed CHAIN directly from rough segments with COINCIDENT + TANGENT at each join. No trim phase at all. The liquid-mixer block (4 lines + 2 corner arcs), boss peanut (4-arc chain), and cutout (4 lines + 2 ear arcs) all build this way — every join and center solved exactly from the drawing's dimension scheme.
- **Topology to be discovered** (overlapping shapes whose intersections define the outline): place full circles/lines, solve the layout, then Step 5's split/trim workflow. Verified end-to-end on constrained sketches — the trimmed profile keeps its constraints and re-solves on dimension changes (see Step 5 trim rules).

### Diagnosing an under-constrained scheme

Read back every join point and center after solving and compare against expected values. The failure pattern is PARTIAL exactness: points downstream of the datum land exactly, the unconstrained subgraph drifts (liquid-mixer cutout first pass: bottom chain exact, left side off by ~1 — 4/8). The fix is never "nudge the seeds": find the DRAWING FACT the scheme hasn't encoded and add it as a constraint — there, "ears bulge outward only" became ear-center-COINCIDENT-on-edge-line ×2, and 4/8 → 8/8 exact. Solved readbacks doubling as the dimension-checklist verification is the point of the conditioned workflow.

### Verification readouts

Dimensions created WITHOUT `value` double as measurements: their auto-calculated value must match the source drawing (a reading of 47.8 where the drawing says 48 means the layout scheme is off). They also render in snapshots, which makes the visual comparison in Step 6 self-documenting.

### Dimension patterns

```js
// Diameter on a circle
await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circleId] })

// Distance between two circle centers (extract point IDs first)
const ptA = (await api.v1.sketch.getPoints({ id: circleA })).result.centerId
const ptB = (await api.v1.sketch.getPoints({ id: circleB })).result.centerId
await api.v1.sketch.dimension({
  id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [ptA, ptB]
})

// Angle between two lines (dimPos selects the angle sector)
await api.v1.sketch.dimension({
  id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [x, y, 0]
})

// "Distance to a center mark" (drawing crosshair with no geometry under it, e.g. a slot
// center): make the mark a real, constrainable point — the dimension then drives it.
const ctr = (await api.v1.sketch.point({ id: skId, pos: [xRough, yRough, 0] })).result
await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [ctr, axisLineId] })
await api.v1.sketch.dimension({
  id: skId, type: 'VERTICAL_DISTANCE', geomIds: [slotBottomEndPt, ctr], value: 3.5
})
```

### Dimension API notes

- `HORIZONTAL_DISTANCE` / `VERTICAL_DISTANCE` with 2 geomIds: **both must be points**. Use `getPoints(circleId).centerId` to get point IDs from circles.
- `ANGLE` works with non-intersecting lines — the solver extends them to their virtual intersection.
- `OFFSET` between two parallel lines measures perpendicular distance, even if the lines don't overlap in projection.
- `value` at creation drives the solver (verified 2026-06-10). On a PLANELESS sketch the same call errors without resizing — a dead solver masquerading as a broken param. Anchor a datum first or the solver picks what to move.
- `updateDimension` re-solves the system: `result: 1|2` = solved (2 = well-constrained), `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
- `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.

### Solver facts (verified 2026-06-10, extended 2026-07-02)

- **TANGENT (line ↔ circle/arc) uses the INFINITE line.** The tangency point may lie beyond
  the segment's endpoints — e.g. an arm edge tangent to a width-gauge circle whose contact
  point is past the fillet junction solves exactly (mounting-plate, 1.6e-14). No constraint
  forces the contact into the segment.
- **A tangent-chain junction can degenerate.** `TANGENT(line, arc)` + COINCIDENT shared
  endpoint has a spurious solution family at arc radius → 0 (line through the arc center).
  A consistent scheme never lands there — every observed collapse (R dim reading "R0",
  `CalcBulges radius too small`, `SetSE NullMem`) traced back to explicit junction wiring
  that CONTRADICTED the auto-constraints' seed-derived wiring (endpoint roles swapped on
  mirrored arcs). If you see these symptoms, diff your junction bookkeeping against the seed
  adjacency before blaming the solver — and re-run with autos off to expose the mis-wiring
  as a plain displacement.

- **TANGENT keeps the seeded branch.** Circle–circle/arc–circle tangency seeded EXTERNAL solves external (d = r1+r2); seeded INTERNAL stays internal (d = R−r) through creation and every re-solve — an R12 dome inside-tangent to Ø5.6 eye circles followed the internal branch exactly when the eyes were re-dimensioned to Ø7 (robot-head session).
- **Encode "2×" annotations as ONE driving dimension + EQUAL_RADIUS/EQUAL_LENGTH**, not two dims. `updateDimension` has NO batch form (an array param is a silent null no-op), so twin dims must be updated sequentially — and for symmetric schemes the intermediate state is unsolvable (result 0), which can leave a **stale arc `bulge`** in the structure tree even after the pair completes and all positions solve exactly (server bug, TODO #174 — see `sketch/updateDimension.md`). With EQUAL_*, one update re-solves both sides in a single solvable step and the trap never triggers.
- **Don't pass `dimPos` at dimension creation** (except for ANGLE sector selection) — it can poison the whole `dimension` batch (maxLevel 51, VOID dims, half-driven sketch). Create dims bare, then place text via `updateDimensionPosition` (see `sketch/dimension.md`).
- Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
- Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
- Deleting a constraint does NOT revert geometry.
- **Trim is safe on constrained sketches** (verified 2026-06-10): constraints and dimensions survive `preTrim → trim → postTrim`, the system auto-wires cut points with `Auto_Coinc`, and the trimmed profile stays CONDITIONED — `updateDimension` re-solves it (even through an extrusion: a trimmed-then-extruded peanut regenerated to the analytic volume after re-dimensioning, Δ 0.002%). One hard rule: **all constraint/dimension handles are recreated with new IDs on every `postTrim`** — re-fetch them by name from the structure tree before updating.
  - ⚠️ One unresolved incident (2026-08-17, TODO #174): a whole-sketch `preTrim` on a constrained tangent-junction profile hung a LONG-LIVED worker terminally (100% CPU until process death). The exact sequence replays clean on a fresh worker, so the trigger is worker state, not the sketch — but when the profile topology is known, prefer the chain path above (no trim phase) and you are immune either way.

---

## Construction geometry (`isConstruction`)

Construction geometry is **reference/skeleton** geometry — centerlines, axes, bolt circles, symmetry lines. It
drives the real profile through constraints and dimensions but is **not part of the profile** and is **excluded
from operations**. Every curve creator takes an `isConstruction` flag (boolean, default `FALSE`):

```js
await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0], isConstruction: true }) // a symmetry axis
await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 40, isConstruction: true })         // a bolt circle
```

- Available on `line`, `circle`, `arcByCenter`, `arcBy3Points`; on `rectangle` it flags all four lines; and per
  sub-item in the batch `geometry` call (`lines[].isConstruction`, `circles[].isConstruction`, etc.). **Points
  cannot be construction** — it's a curve property.
- **Toggle it on existing geometry** with `updateGeometry({ id, lines: [{ id, isConstruction: true }] })` (works
  both ways; also circles/arcs).

**What it's for — a first-class constraint reference.** Construction curves participate fully in the solver. Drop a
construction axis and make real geometry `TANGENT`/`SYMMETRIC`/`COINCIDENT` to it; the solver enforces it (verified:
a real circle made tangent to a construction axis at x=0 solved its center onto the tangent). Use it as the skeleton
the drawing's dimension scheme hangs off — exactly the dashed centerlines/reference axes from Step 1.

**Hard rules:**
- **Never feed construction curves to an operation.** `part.extrusion` on a normal profile builds a solid; passing
  construction-only curves to a region op (`part.extrusion`/`part.revolve`/`part.twist`) returns an error
  (`maxLevel 51`, "No usable (non-construction) geometry was selected for this operation."), not a solid — they form
  no extrudable profile. Construction geometry is skeleton, not material.
- **`getGeometry` lumps construction curves into its `lines`/`circles`/`arcs` arrays** — you can't tell them apart
  from it. To identify construction geometry use `getObjectInfo` (`isConstruction: 0|1`), `getObjectsLists`
  (`constructionGeometry: id[]`), or `getGlobalState` (`constructionCount`).
- In snapshots, construction geometry renders **dashed** (distinct from the solid profile).
- **Construction curves participate in `preTrim` splitting.** A construction centerline
  crossing a circle adds real split points: an eye circle tangent to two curves AND crossed
  by its centerline staged as **4** arcs, not 2 (verified 2026-07-02). Budget for the extra
  segments when classifying, and remember the centerline's own splits merge back on `postTrim`
  as long as you don't trim them.

---

## Step 5 — Trim

Once shapes are positioned and verified, trim them to reveal the final profile.

### The three-step trim workflow

```js
// 1. Split curves at their intersection points (staged — nothing visible changes)
//    Returns structured result: [{ sourceId, splittedCurves: [{ id, interval }] }]
const split = (await api.v1.sketch.preTrim({ id: skId })).result

// 2. Mark unwanted segments for removal (still staged) — pass the splittedCurves ids
await api.v1.sketch.trim({ id: skId, curveIds: segmentsToRemove })

// 3. Apply the trims (geometry changes now)
await api.v1.sketch.postTrim({ id: skId })
```

### Recognizing which segments to trim — the boundary test (validated 2026-07-01)

`preTrim` returns `[{ sourceId, splittedCurves: [{ id, interval }] }]`. With many crossing elements it produces
dozens of segments; the hard part is deciding which to remove. The robust, general method is the **boundary test**:

1. **Define the target filled region(s)** you want the outline of — closed shapes (`{kind:'circle',c,r}`,
   `{kind:'rect',a,b}`, or a polygon). For a union of shapes, that's the shapes themselves; for "outer boundary of
   a mesh", it's the bounding rectangle; to "extract a sub-region", it's that region's rectangle.
2. **For each staged segment, compute its midpoint and outward normal from the segment's OWN geometry** (see box
   below — never from the `interval`).
3. **Probe `mid ± ε·normal`** and ask "is each probe point inside ANY target shape?" (point-in-shape: circle
   `|P−c| < r−tol`; polygon ray-cast). **Keep the segment iff material is on exactly ONE side** (`in⁺ XOR in⁻`) —
   it's a boundary edge. **Trim** the interior (`in⁺ AND in⁻`) and the dangling (`NOT in⁺ AND NOT in⁻`).
4. `trim` the not-kept ids, then `postTrim`. Contiguous kept pieces coalesce.

```js
// per segment: keep iff material on exactly one side of the target region(s)
const p1 = [mid[0] + eps*nx, mid[1] + eps*ny], p2 = [mid[0] - eps*nx, mid[1] - eps*ny]
const keep = inAnyShape(p1) !== inAnyShape(p2)     // XOR → boundary
```

**Computing a segment's midpoint + normal (do NOT use `interval`).** Look up the segment node by id in the
structure tree and branch on its class:
- **`CC_Line`** — midpoint = mean of `getPositions` endpoints; normal ⟂ the direction.
- **`CC_Arc`** — derive it from the segment's signed **`bulge`** (`members.bulge.value`, = tan(includedAngle/4))
  and its endpoints `s,e`: `θ = 4·atan(bulge)`, `R = |s−e|/(2·sin(θ/2))`, center = chord-midpoint offset by
  `R·cos(θ/2)` along the chord's left-normal, arc-midpoint at start-angle `+ θ/2`, normal radial. This is the same
  math the arc renderer uses, and it is **robust for a circle cut any number of times**.

> **Why not the `interval`→angle shortcut?** Mapping a circle-arc `interval` (turn-fraction from the +X seam) to an
> angle only holds when a circle is cut into exactly **2** arcs. A circle cut 4× (by another circle *and* a line)
> has sub-arc intervals that are not global turn-fractions, and the shortcut silently mis-locates the midpoint
> (→ everything mis-classified). Always use the bulge geometry.

**The naive rule fails.** "Trim iff the midpoint is inside another shape" has no *both-sides* notion: it keeps
**dangling stubs** that lie outside every shape (e.g. a line overhanging past all the circles it crosses), and it
mis-handles segments that are interior to the target region yet outside every individual placed shape. The XOR
boundary test handles all of these uniformly. (Verified: on two circles + a diameter line overhanging both ends,
the naive rule left two dangling line stubs; the boundary test produced the clean 2-arc union outline.)

**Operational rules.** Run **one trim workflow per harness run** — two independent `preTrim→trim→postTrim` cycles
in the same run interfere (`trim` resolves `curveIds` globally). Trimming a circle down to arcs can leave the
circle's **center point** behind as an isolated `points[]` entry — delete it with `deleteObject` if the profile
must be point-clean.

### Carving INNER loops (discard the outer curves)

The boundary test is not just for outer outlines — an inner loop is the **same test over a deeper target region**.
Two knobs (validated 2026-07-01 across lens/Reuleaux/crossing-rects/rounded-cell/4-circle cases):

- **Containment depth.** Keep a segment iff it bounds the region "inside **≥ k** shapes":
  `keep = (countIn(p1) ≥ k) XOR (countIn(p2) ≥ k)`.
  - `k = 1` → the **outer** union outline.
  - `k = 2` → the pairwise **overlap** (two circles → the lens; two rectangles → the central square).
  - `k = N` → the region inside **all N** shapes (3 circles → Reuleaux triangle; 4 circles → curvilinear "cushion").
  Each increment of `k` strips one layer inward. This directly discards the outer curves and keeps the inner loop.
- **Arbitrary region predicate.** For inner loops that aren't a pure overlap (a specific grid cell, a cell with a
  circular bite, any composite void), keep a segment iff a caller predicate `region(P)→bool` **flips across the ±ε
  probe**. E.g. `region = P => inCell(P) && !inCircle(P, c, r)` carved a rounded inner cell out of a 32-segment
  grid+circle field. Any `P→bool` region works — it need not be a boolean of primitives.

Practice: **predict the target profile first** (segment counts, arc `bulge`/angle, key coordinates), then classify,
trim, `postTrim`, and check the realized geometry matches — a falsifiable test beats eyeballing the after-snapshot.

### Trim rules

- `trim` only accepts IDs returned by `preTrim` — not original geometry IDs
- `trim` is **atomic** — one invalid ID fails the entire call, no partial trims
- After `postTrim`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
- `preTrim → postTrim` without trimming is a safe no-op for GEOMETRY ids (round-trip restore) — but constraint/dimension nodes are recreated with new IDs anyway
- **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after `postTrim` (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
- **Contiguous kept segments coalesce** into a single curve on `postTrim` — keeping 3 adjacent segments of a circle yields 1 arc
- Tangent-only contacts: a singly-tangent circle stays whole (staged as one full-circle part); a doubly-tangent circle (fillet between two shapes) splits into 2 arcs at the tangent points
- **Drawing-faithful ≠ extrudable.** A sketch that keeps its boss/eye circles FULL (as drawings
  draw them) with the profile tangent to them is NOT a valid region: `part.extrusion` fails
  with *"Brep after linear sweep not manifold"* — and still creates a broken feature object
  (non-null result, maxLevel 51) that you must `part.deleteFeature`. To get a solid, rim-trim
  first: `preTrim` splits each doubly-tangent circle at its tangent points (plus any
  construction-centerline crossings — expect 4 segments, all minor arcs), trim the inner arcs
  (apex = center + R·unit(chordMid − center); nearest-to-body apexes are the inner ones), keep
  the rim — contiguous rim pieces coalesce on `postTrim` — then extrude (verified 2026-07-02,
  volume matched analytic area to 1e-4).

---

## Step 6 — Evaluate and Iterate

### Pass 1: Checklist verification

Go through the dimension checklist. A row is checked ONLY by citing the dimension ENTITY
(name/id) that realizes it plus the measured value from placed geometry, within tolerance.
"Satisfied implicitly by constraints" is a fail unless the drawing genuinely has no such
annotation.

### Pass 2: Topology comparison

Count and classify curves against the drawing BEFORE judging looks: full circles vs arcs vs
lines, per feature. A sketch can match the silhouette perfectly while being topologically
wrong — closed eye circles reproduced as boundary arcs passed the silhouette pass and failed
review (2026-07-02).

### Pass 3: Visual comparison

Snapshot the sketch and compare side-by-side with the source:
- Overall proportions and silhouette
- Feature sizes relative to each other
- Position offsets (centered vs shifted)
- Profile continuity after trimming (gaps = missed connections)

### Iteration triggers

| Symptom | Fix |
|---------|-----|
| Dimension value wrong | Adjust circle center or radius |
| Visual proportions off | Re-examine dimension interpretation |
| Profile has gaps after trim | Fix segment classification (contour vs hole vs slot) |
| Dimensions overlap geometry | Use `updateDimensionPosition` or renderer de-overlap |

---

## Reference: Tangent Lines Between Circles

For straight edges between circular features, compute tangent lines:

**Equal-radius circles** (e.g., boss-to-boss edges):
```js
function outerTangent(A, B, r) {
  const d = normalize(sub(B, A))
  const p = perp(d) // 90° rotation
  const mid = scale(add(A, B), 0.5)
  // Pick the perpendicular direction pointing away from body interior
  const outerP = (len(add(mid, p)) > len(sub(mid, p))) ? p : scale(p, -1)
  return [add(A, scale(outerP, r)), add(B, scale(outerP, r))]
}
```

**Different-radius circles**: use the standard formulas — external tangent when `d = R₁ + R₂`, internal tangent when `d = |R₁ − R₂|`.

---

## Reference: Deriving Circle Centers from Tangency

**Prefer the solver:** TANGENT constraints + a RADIUS/DIAMETER dimension derive these centers for you (see the worked example in Step 4). The math below remains useful for pre-planning and for cross-checking solver output against the drawing.

When explicit coordinates aren't given, derive centers from tangency conditions between shapes:

| Tangent type | Center-to-center distance |
|-------------|--------------------------|
| External (shapes on opposite sides) | d = R₁ + R₂ |
| Internal (one inside the other) | d = \|R₁ − R₂\| |

Two tangency conditions → two circle equations → subtract to get a linear equation → substitute back → solve the quadratic. Two solutions — pick the one on the correct side of the profile.

---

## Reference: Arm / Wall Geometry

For narrow connecting arms (width W between a hub of radius R_h and a boss of radius R_b):

```js
const dir = normalize(bossCenter) // direction hub → boss
const perp = [-dir[1], dir[0]]     // perpendicular
const hw = W / 2                    // half-width

// Where the arm wall exits the hub circle
const tHub = Math.sqrt(R_h ** 2 - hw ** 2)
const hubPt = add(scale(perp, hw), scale(dir, tHub))

// Where it enters the boss circle (solve quadratic)
const offset = scale(perp, hw)
const v = sub(offset, bossCenter)
const b = 2 * dot(v, dir), c = dot(v, v) - R_b ** 2
const tBoss = (-b - Math.sqrt(b * b - 4 * c)) / 2
const bossPt = add(offset, scale(dir, tBoss))
```

---

## ClassCAD Sketch API — Quick Reference

### Geometry creation
| What | API | Key params |
|------|-----|-----------|
| Circle | `sketch.circle` | `centerPos`, `radius` |
| Line | `sketch.line` | `startPos`, `endPos` |
| Arc | `sketch.arcByCenter` | `startPos`, `endPos`, `centerPos`, `isClockwise` |
| Batch | `sketch.geometry` | `circles`, `lines`, `arcsByCenter` arrays |

### Querying
| What | API | Returns |
|------|-----|---------|
| All geometry IDs | `sketch.getGeometry` | `{ points, lines, arcs, circles }` |
| Child point IDs | `sketch.getPoints` | `{ startId, endId }` / `{ centerId }` |
| Coordinates | `sketch.getPositions` | `{ pos }` / `{ startPos, endPos }` |

### Modifying
| What | API | Notes |
|------|-----|-------|
| Move geometry | `sketch.updateGeometry` | Raw position set, requires ALL coords |
| Delete | `sketch.deleteObject` | `{ ids: [id1, id2, ...] }` |
| Split at intersections | `sketch.preTrim` | Staged — needs postTrim; structured result |
| Mark for removal | `sketch.trim` | Only preTrim segment IDs |
| Apply trims | `sketch.postTrim` | Commits staged state |

### Common pitfalls
- **A sketch without `planeId` has a DEAD solver** — constraints and dimensions are accepted (maxLevel 31, IDs returned!) but never enforced; `updateDimension` returns 0; `dimension` with `value` errors (51) without resizing. Always pass `planeId` to `sketch.create` — and verify the id you pass actually resolved (an undefined lookup is accepted silently). This silent mode makes constraints look like inert metadata and value-dims look broken; both work on a properly created sketch.
- **Z must be 0** for all 2D sketch coordinates — non-zero Z is a hard error (code 1014)
- **FIXATION on a line does not lock its length** — fix both endpoints individually for a true datum
- **`getPositions` fails on circle IDs** — use `getPoints` → `centerId` → `getPositions`
- **`preTrim` ≠ `splitCurve`** — completely different operations: `preTrim` splits at all mutual intersections (the trim workflow); `splitCurve` splits one curve at explicit normalized parameter values

---

## Related

- [sketch/constraint.md](sketch/constraint.md) — geometric constraints
- [sketch/dimension.md](sketch/dimension.md) — dimensional constraints
- [sketch/circle.md](sketch/circle.md) — circle creation and querying
- [sketch/line.md](sketch/line.md) — line creation
- [sketch/arcByCenter.md](sketch/arcByCenter.md) — arc creation
- [sketch/geometry.md](sketch/geometry.md) — batch geometry creation
- [sketch/preTrim.md](sketch/preTrim.md) — split at intersections (stage)
- [sketch/trim.md](sketch/trim.md) — mark segments for removal
- [sketch/postTrim.md](sketch/postTrim.md) — apply trims / merge back
- [sketch/splitCurve.md](sketch/splitCurve.md) — split one curve at explicit params
