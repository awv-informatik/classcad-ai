# Training: arc direction (isClockwise) & bulge semantics

**Date:** 2026-08-19
**Trigger:** ph reports agents "fundamentally have an issue with bulges and isClockwise" —
arcs come out flipped in builds. The skill claims (constrained-sketching.md):
`isClockwise: true` = math-NEGATIVE sweep in local coords on all three planes;
bulge: `θ = 4·atan(bulge)` (renderer math); curve-domain polyline2d documented
`tan(a/4), 0=line, 1=semicircle, negative=clockwise`. The sketch-domain bulge SIGN
convention and its relation to the flag have never been measured directly.

## Goal

Nail the exact, measured semantics of arc direction in the sketch domain.

**Methods to cover:**

- `sketch.arcByCenter` — `isClockwise` TRUE/FALSE, exact sweep in sketch-local coords
- `sketch.arcBy3Points` — how the sweep is determined (no flag), bulge sign
- `sketch.updateGeometry` — `arcsByCenter` flag flip; start/end swap with same flag
- `CC_CircularArc` tree node — `members.bulge.value`: formula, sign, orientation reference
- `sketch.getObjectInfo` on arcs — what direction info it exposes
- `sketch.preTrim` sub-arcs — bulge values of split segments (boundary-test math)

**Questions (each → a named script):**

1. `isClockwise: true`: which sweep in sketch-LOCAL coordinates? Calibrate with a
   chord-closed segment extrusion — volume (minor vs major) + COG side (bulge side).
   → 01-flag-top.mjs
2. Tree `bulge`: formula (`tan(sweep/4)`?), sign vs flag, reference direction
   (start→end in creation order?). → 02-bulge-tree.mjs
3. Do the local-coordinate semantics hold on Front and Right planes (world-mirrored
   locals)? → 03-planes.mjs
4. `arcBy3Points`: which arc materializes, what bulge sign? → 04-arcBy3Points.mjs
5. `updateGeometry`: does flipping `isClockwise` flip the arc? Does swapping
   start/end with the SAME flag mirror it (the "mirrored arcs keep the flag" claim)?
   → 05-update-flip-swap.mjs
6. Sub-arc bulges after preTrim on a known circle: does the reconstruction math
   (θ=4·atan(bulge), center from chord + bulge sign) hold for every segment?
   → 06-split-bulges.mjs
7. After a solver re-solve (dimension change moves the arc), do bulge and positions
   stay consistent? (TODO #174 claimed a stale-bulge case.) → 07-solver-bulge.mjs
8. The trap that motivated this: a flip that PRESERVES volume (semicircle across its
   chord) — show volume can't catch it and COG can. → folded into 01 (semicircle cases)

**Verification discipline:** every directional claim is backed by mass-property
numbers (volume + COG side) or exact position readbacks — never by snapshot alone.
Snapshots are illustration only.

## Journal

### Run 01 — 01-flag-top.mjs — flag ground truth (volumes)

Segment-extrusion calibration on Top, r=10, h=5. Analytic: minor quarter-segment
142.70, major 1428.10, semicircle 785.40.

| case                              | volume   | verdict                                  |
| --------------------------------- | -------- | ---------------------------------------- |
| quarter (10,0)→(0,10) cw=**true** | 1428.405 | **MAJOR** segment — swept 0°→−270°       |
| quarter same points cw=**false**  | 142.699  | MINOR — swept 0°→+90°                    |
| semi (−10,0)→(10,0) cw=true       | 785.387  | volume can't discriminate (as predicted) |
| semi same cw=false                | 785.374  | "                                        |

**Finding (measured):** `isClockwise: true` sweeps in the **math-negative direction
(decreasing angle) in sketch-local coordinates** — confirms the constrained-sketching
claim with numbers. cw=false = math-positive.

**Bycatch:** `calculateMassProperties` returns `result.cog`, NOT `result.centerOfGravity`
— the latter reads as `undefined` silently. 📌 LLM doc: already correct in
calculateMassProperties.md; the ar15 session used the wrong key and never noticed
(returned undefined into its summary). Semicircle COG discrimination redone in run 02.

### Run 02 — 02-bulge-tree.mjs — tree bulge ↔ flag ↔ COG

| case             | bulge        | vol     | cog (x,y)       | interpretation                              |
| ---------------- | ------------ | ------- | --------------- | ------------------------------------------- |
| quarter cw=true  | **−2.41421** | 1428.40 | −0.58,−0.58     | −tan(270°/4), major, bulge side −x−y        |
| quarter cw=false | **+0.41421** | 142.70  | +5.84,+5.84     | +tan(90°/4), minor, bulge side +x+y         |
| semi cw=true     | **−1.0**     | 785.39  | −0.00,**+4.24** | 180° sweep from 180°→0° decreasing, apex +y |
| semi cw=false    | **+1.0**     | 785.37  | +0.00,**−4.24** | apex −y                                     |
| semiV cw=true    | −1.0         | 785.53  | **−4.24**,−0.00 | apex −x                                     |
| semiV cw=false   | +1.0         | 785.40  | **+4.24**,0.00  | apex +x                                     |

**Findings (measured):**

- `CC_CircularArc.members.bulge.value` = **tan(signedSweep/4)** with the sweep signed
  start→end in sketch-local coords: **positive = math-positive (CCW), negative =
  math-negative (CW)**. Same convention as curve-domain polyline2d bulges.
- `isClockwise: true` ⇔ negative bulge — always, on every case measured.
- Semicircle COG flips side with the flag while volume stays identical (785.4 both
  ways) — the measured demonstration of why volume checks can't catch a flipped arc
  (question 8 answered).
- 4.24 = 4R/(3π), the analytic semicircle-centroid offset — probes land on theory to 3
  decimals.
- **`getObjectInfo(arc)` exposes NO direction info** — `geometry: {startId, endId,
centerId, radius}` only, no bulge, no flag. `getPositions` likewise. The tree node's
  `members.bulge.value` is the ONLY direction readback. 📌 LLM doc.

### Run 03 — 03-planes.mjs — plane invariance

Same minor quarter arc (local coords, cw=false) on Top / Front / Right: bulge
**+0.41421 identical on all three**; world COGs match the documented local→world
mappings to 1e-3 (Top (5.84,5.84,2.5)✓, Front (5.84,2.5,−5.84)✓, Right
(2.5,−5.84,5.84)✓). **The flag and bulge are purely sketch-LOCAL; world appearance
follows the plane mapping.** Confirms the constrained-sketching table with mass
properties.

### Run 04 — 04-arcBy3Points.mjs — 3-point arcs

| case               | bulge    | vol     | cog         | matches                 |
| ------------------ | -------- | ------- | ----------- | ----------------------- |
| mid at +y apex     | −1.0     | 785.39  | +4.24y      | ≡ semi cw=true (run 02) |
| mid at −y apex     | +1.0     | 785.37  | −4.24y      | ≡ semi cw=false         |
| minor via 45° mid  | +0.41421 | 142.70  | +5.84,+5.84 | ≡ quarter cw=false      |
| major via 225° mid | −2.41421 | 1428.40 | −0.58,−0.58 | ≡ quarter cw=true       |

**Findings:** `arcBy3Points` (param `midPos`, an on-arc point) produces the identical
`CC_CircularArc` representation; the sweep is whichever passes through `midPos`, and
the stored bulge follows the same signed convention. `getPositions` keeps creation
order (start stays start). To build an arc without direction headaches, arcBy3Points

- an on-arc point IS the flag-free alternative.

### Run 05 — 05-update-flip-swap.mjs — updateGeometry & traversal order

- **(a) Flip in place: `updateGeometry` IGNORES `isClockwise`.** Same positions +
  `isClockwise: true` on a CCW arc → maxLevel 31 (success!), bulge unchanged
  (+0.4142), volume unchanged (142.7). Silent no-op — the existing arcByCenter.md
  claim "isClockwise can be changed via updateGeometry" is **WRONG**. 📌 LLM doc fix.
- **(b) Swapped endpoints, same flag = COMPLEMENTARY arc**, not the same arc: start
  (0,10)→end (10,0) cw=false gave bulge +2.4142 (major CCW 270°), cog (−0.58,−0.58).
  Traversal order matters exactly as the sweep definition implies.
- **(c) Mirror claim CONFIRMED with numbers:** mirrored profile traversed in reverse
  with the SAME flag = the mirrored arc. (0,10)→(−10,0) cw=false → bulge +0.4142
  minor, cog (−5.84,+5.84) = mirror image of the original (+5.84,+5.84). ✓

### Run 06 — 06-split-bulges.mjs — staged sub-arc bulges (3 cases, 8 segments)

All staged sub-arcs reconstruct their source circle EXACTLY (center err ≤ 3.6e-15,
R err ≤ 3.6e-15): circle+chord (2×180°), circle+line+circle (82.8°/48.6°/180°/48.6°),
near-tangent chord (73.7° + **286.3° major sub-arc, bulge 3.0**). The recipe's
reconstruction math (θ=4·atan(bulge), center = chordMid + (chord/2)/tan(θ/2)·leftNormal
≡ R·cos(θ/2)·leftNormal) is **correct including the major-arc case** — cos(θ/2)'s sign
flip handles it. My first run mislocated 3/4 centers with `mid − ln·h`: the offset is
**+leftNormal**, sign carried by tan/cos. Lesson for the boundary-test doc: state the
formula with explicit sign once, exactly.

### Run 07 — 07-update-flag-matrix.mjs — when is the update flag honored?

| op                                                             | bulge after           | verdict                                  |
| -------------------------------------------------------------- | --------------------- | ---------------------------------------- |
| created cw=false (+0.4142), update NEW positions + cw=**true** | +0.4142 (minor, r=20) | **flag ignored even with new positions** |
| created cw=false, update new positions, no flag                | +0.4142               | sweep character preserved                |
| created cw=**true** (−2.4142), update new positions, no flag   | **−2.4142**           | sweep character preserved                |
| control: fresh create at new positions, cw=true                | −2.4142               | creation honors the flag                 |

**Finding:** the direction of an existing arc is IMMUTABLE via `updateGeometry` —
`isClockwise` is accepted and silently ignored (maxLevel 31); the arc keeps its
creation-time sweep character through position updates. To flip an arc: delete and
recreate (or use arcBy3Points from the start). 📌 LLM doc.

### Run 08 — 08-solver-bulge.mjs — solver re-solve consistency

Constrained tangent-junction profile (FIX line endpoints + TANGENT + RADIUS dim),
re-dimensioned r=10→15→6: bulge stayed +0.414214 (the 90° sweep is what tangency
demands), R(bulge-reconstructed) ≡ R(positions) to ≤3.6e-15 at every step. **No stale
bulge on this clean path** — the TODO #174 stale-bulge incident (twin-dim sequential
update through an unsolvable intermediate) remains the only known corruption path; a
normal solvable re-solve keeps bulge exact.

### Run 09 — 09-split-cw-arc.mjs — sub-arc direction inheritance

Parent: major CW arc, bulge −2.4142 (0°→−270°). Split by a crossing line →
2 segments: bulges **+1.0 and +0.4142, both POSITIVE**, endpoints reordered
((0,10)→(0,−10)→(10,0) — reversed vs parent traversal). **The splitter normalizes
staged sub-arcs to CCW (positive bulge) regardless of parent direction** — consistent
with run 06 where every circle sub-arc came back positive. Consequence for the
boundary test: never assume a parent's sign survives preTrim; read each staged
segment's own bulge + endpoints. 📌 LLM doc.

## Coverage check

- [x] Q1 flag ground truth → 01 (volumes) + 02 (COG)
- [x] Q2 bulge formula/sign → 02, corroborated 04, 06, 09
- [x] Q3 plane invariance → 03 (three planes, world-COG match 1e-3)
- [x] Q4 arcBy3Points → 04
- [x] Q5 update flip + swap + mirror claim → 05, 07
- [x] Q6 split reconstruction incl. major sub-arc → 06 (8 segments, ≤3.6e-15)
- [x] Q7 solver re-solve consistency → 08
- [x] Q8 volume-blind flip demo → 01+02 semicircle rows

## Skill Updates

1. `references/sketch/arcByCenter.md` — REWRITE the isClockwise bullet with the
   measured local-sweep semantics + bulge readback section; CORRECT the wrong
   "flip via updateGeometry" claim (in place — it's a silent no-op); add the
   "direction is creation-immutable" and "getObjectInfo exposes no direction" facts.
2. `references/sketch/arcBy3Points.md` — add Direction & bulge section (flag-free
   alternative; same signed-bulge convention).
3. `recipes/constrained-sketching.md` — one-line additions: staged sub-arcs are
   CCW-normalized; updateGeometry cannot flip an arc.
