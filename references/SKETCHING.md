# Sketching Guide — Reproducing Technical Drawings in ClassCAD

A practical guide for parsing 2D technical drawings and recreating them as ClassCAD sketches. Covers the full pipeline from dimension analysis through constraint-driven layout, trimming, and iterative evaluation.

## The Method

**Don't try to draw the final profile directly.** The visible outline of a mechanical part is the result of trimming and intersecting simpler shapes. Reconstruct those original shapes, let the solver lay them out from constraints and dimensions, then trim.

```
1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Constrain & Dimension → 5. Trim → 6. Evaluate
```

**The sketch is a conditioned model, not a coordinate dump.** Analysis (Steps 1–2) tells you the drawing's dimension *scheme*; constraints and dimensions (Step 4) hand that scheme to ClassCAD so the solver computes the layout. Hardcoding every coordinate works for a one-shot reproduction, but the result can't adapt — change one value and nothing follows. A constrained sketch re-solves (verified: re-dimensioning a boss Ø45→Ø60 moved its tangent fillet to the new exact position automatically).

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
- [ ] D1: Ø38 — DIAMETER — hub outer circle
- [ ] D2: 48 — HORIZONTAL_DISTANCE — center to boss
- [ ] D3: 14° — ANGLE — arm angle from horizontal
...
```

**Format**: `[ ] <id> <value> — <type> — <what it controls>`

This checklist serves three purposes:
1. **Completeness** — forces you to account for every annotation before coding
2. **Evaluation gate** — after building, check each box only when the placed geometry matches
3. **Iteration tracker** — unchecked items tell you exactly what's still wrong

---

## Step 3 — Recognize the Original Shapes

**What you see in a technical drawing is not what was drawn.** The visible profile is the result of trimming simpler, natural shapes — circles, lines, arcs — at their intersection points. An organic-looking contour is often just a handful of overlapping circles with interior segments removed.

If you can recognize the original shapes BEFORE trimming, reconstruction is straightforward: place the shapes, then trim. Trying to trace the final profile directly means working backwards, and errors compound.

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

**Leave the `gen*` auto-constraint flags ON (the defaults).** Auto-incidence wires endpoint-matching geometry together (`Auto_Coinc`), auto-H/V locks axis-aligned lines. That wiring is what lets a later dimension edit move the whole connected profile instead of tearing it: a gen-ON rectangle survives a width change closed; a gen-OFF one stretches one line and leaves the rest behind (verified 2026-06-10). Disable a flag selectively only when it would fight the design intent — e.g. `genVertAndHoriz: false` for a line drawn axis-aligned that will be dimensioned to an angle, or `genTangency: false` when overlapping skeleton circles must stay independently placeable until trimming.

This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix the layout scheme (anchors, dimensions) before proceeding.

---

## Step 4 — Constrain & Dimension — let the solver lay out the sketch

Constraints and dimensions are ACTIVE. On a `planeId` sketch the solver enforces them immediately, physically moving and resizing geometry (all verified 2026-06-10: COINCIDENT snaps points, TANGENT moves to exact tangency, HORIZONTAL rotates preserving length, `DIAMETER value: 45` resizes an r=20 circle to r=22.5 at creation, HD/VD dimensions land a circle center on exact offsets). Declare the drawing's relationships and values; don't hand-compute what the solver can derive.

### Order of operations

1. **Anchor the datum** — `FIXATION` on reference geometry first; without an anchor the solver chooses what to move. Place the datum point EXACTLY at its drawing coordinates before fixing — FIXATION freezes the current position, it doesn't know where the point "should" be. One exactly-placed fixed point per sketch is enough; everything else can be seeded rough. To lock a line completely, fix its two **endpoints** individually: FIXATION on the line itself locks position/direction but NOT length — the solver will happily stretch a "fixed" line to satisfy a COINCIDENT or EQUAL_LENGTH elsewhere (verified).
2. **Relate** — COINCIDENT (connect), TANGENT (tangency), CONCENTRIC, PARALLEL / PERPENDICULAR, HORIZONTAL / VERTICAL, SYMMETRY (axis FIRST in geomIds). Full tables in `sketch/constraint.md`.
3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` is NOT supported in dimensions.

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
```

### Dimension API notes

- `HORIZONTAL_DISTANCE` / `VERTICAL_DISTANCE` with 2 geomIds: **both must be points**. Use `getPoints(circleId).centerId` to get point IDs from circles.
- `ANGLE` works with non-intersecting lines — the solver extends them to their virtual intersection.
- `OFFSET` between two parallel lines measures perpendicular distance, even if the lines don't overlap in projection.
- `value` at creation drives the solver (verified 2026-06-10 — an earlier version of this guide called it broken; that observation came from planeless sketches whose solver never ran). Anchor a datum first or the solver picks what to move.
- `updateDimension` re-solves the system: `result: 1` = solved, `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
- `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.

### Solver facts (verified 2026-06-10)

- Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
- Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
- Deleting a constraint does NOT revert geometry.
- **Trim is safe on constrained sketches** (verified 2026-06-10): constraints and dimensions survive `preTrim → trim → postTrim`, the system auto-wires cut points with `Auto_Coinc`, and the trimmed profile stays CONDITIONED — `updateDimension` re-solves it (even through an extrusion: a trimmed-then-extruded peanut regenerated to the analytic volume after re-dimensioning, Δ 0.002%). One hard rule: **all constraint/dimension handles are recreated with new IDs on every `postTrim`** — re-fetch them by name from the structure tree before updating.

---

## Step 5 — Trim

Once shapes are positioned and verified, trim them to reveal the final profile.

> **⚠️ RETRAIN PENDING (Category 4.10):** The APIs below were renamed (`splitAllCurves`→`preTrim`,
> `trimCurves`→`trim`, `splitCurvesMergeBack`→`postTrim`) and `preTrim` now returns a **structured**
> result — `[{ sourceId, splittedCurves: [{ id, interval }] }]`, one entry per input curve — not the
> flat segment array the classification prose below assumes. `preTrim` also accepts a `curveIds`
> subset. The behavioral findings (handles recreated, `Auto_Coinc`, atomic trim) are carried over
> from the old workflow and must be re-verified during retraining. Treat the segment-walking logic
> below as a sketch of intent, not a tested recipe, until then.

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

### Classifying segments

With many overlapping shapes, `preTrim` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.

**Approach — the boundary test.** Each staged segment node carries `partOf` (original curve ID) and `interval` (`[t0,t1]` as a **0..1 fraction** of the curve — not radians, phase not world-aligned). `getPositions` works on segment IDs. Compute the segment's world midpoint (angles of start/end around the center; pick the traversal direction whose span fraction is closer to the interval width), then probe the midpoint pushed **±ε radially**: the segment belongs to the final outline iff material lies on exactly ONE side.

Plain midpoint-inside-another-shape is NOT sufficient: segments can be interior to the final region while outside every placed shape (e.g. a boss arc between its fillet-tangent point and the boss-boss crossing sits inside the fillet *patch*) — the boundary test handles all of these uniformly.

Assign roles to your shapes before trimming:
- **Contour shapes** (profile boundary): trim segments that fall inside other contour shapes
- **Hole shapes** (through-holes, bores): keep all segments — they're entirely inside the body
- **Slot shapes** (internal cutouts): keep segments inside the body contour, trim the rest

### Trim rules

- `trim` only accepts IDs returned by `preTrim` — not original geometry IDs
- `trim` is **atomic** — one invalid ID fails the entire call, no partial trims
- After `postTrim`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
- `preTrim → postTrim` without trimming is a safe no-op for GEOMETRY ids (round-trip restore) — but constraint/dimension nodes are recreated with new IDs anyway
- **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after `postTrim` (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
- **Contiguous kept segments coalesce** into a single curve on `postTrim` — keeping 3 adjacent segments of a circle yields 1 arc
- Tangent-only contacts: a singly-tangent circle stays whole (staged as one full-circle part); a doubly-tangent circle (fillet between two shapes) splits into 2 arcs at the tangent points

---

## Step 6 — Evaluate and Iterate

### Pass 1: Checklist verification

Go through the dimension checklist. For each item, compute the actual value from placed geometry and compare to the expected value. Only check the box if it matches within tolerance.

### Pass 2: Visual comparison

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
- **A sketch without `planeId` has a DEAD solver** — constraints and dimensions are accepted (maxLevel 31, IDs returned!) but never enforced; `updateDimension` returns 0; `dimension` with `value` errors (51) without resizing. Always pass `planeId` to `sketch.create`. This silent mode is what once led this guide to call constraints "metadata" and the value param "broken" — both wrong on a properly created sketch.
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
- `sketch/preTrim.md` — split at intersections _(retrain pending — Category 4.10)_
- `sketch/trim.md` — mark segments for removal _(retrain pending — Category 4.10)_
- `sketch/postTrim.md` — apply trims / merge back _(retrain pending — Category 4.10)_
- `sketch/splitCurve.md` — split one curve at explicit params _(retrain pending — Category 4.10)_
