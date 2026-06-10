# Build: Liquid Mixer V2 — constrained sketches (conditioned rebuild)

**Date:** 2026-06-10
**Approach:** all three profile sketches rebuilt from ROUGH seeds + the drawing's dimension
scheme — the solver lays out the geometry. Feature holes using workCSys cylinders/cones.

![source](files/000_07_Knowledge_Base_18_-_Prepare_technical_Drawing.jpeg)

## Locked interpretation

Interpreted together with ph over several rounds — all dimension chains close. Source:
"Liquid mixer Version 2", Al 6061, ISO 2768-1, 1st angle projection, all mm.

**Coordinate frame (as built):** origin bottom-left of the front view; X right (0..120),
Y up (0..80), Z = depth with the **back face at z=0**, block front face at z=35, boss face
at z=45. The drawing's back view mirrors X relative to this frame (back-view-left =
part-frame-right).

- **Block:** 120 × 80 × 35 (45 over the boss). R10 on both LEFT corners — arc centers
  (10,10) and (10,70). Chain: corner-radius center == upper hole center (10,70) ✓.
- **Boss (peanut), z=35..45:** two R22.5 circles at (41,40) and (79,40) — chain:
  41+38+41 = 120 ✓ dead-centered; joined by R10 concave waist fillets, fillet centers
  (60, 40±26.3676) [√(32.5²−19²)], tangent points at (41+9/13·19, 40±9/13·26.3676).
- **Corner mount holes:** Ø8 THRU at (10,70) and (110,10) [70 = 80−10 ✓; 110 = 120−10 ✓],
  c'bore Ø13.5 ↧8.5 from the front face (floor z=26.5).
- **Per hub (×2):** Ø8.1 ↧10 from the boss face (floor z=35, flush with the block plane),
  csk Ø10×90° at z=45; 3× M4-6H ↧8 (pilot Ø3.3 ↧12, z=33..45) on Ø24 BCD at 120° spacing.
- **Side port (right face x=120, axis y=40, z=20** [20 from the back face]**):**
  G1/2-6H ↧18 with pilot Ø18.63 (x=102..120), then Ø12 (+0.3/−0.1, modeled nominal)
  ↧100 (x=20..120).
- **Back cutout (z=0..5): x 30..120 — clings to the back-view LEFT edge, i.e. OPEN at the
  part's right (port-side) face** [left wall = 120−90 = 30 ✓]; y 20..60 (40 tall, vertically
  centered); two Ø8 ear half-circles on the closed end, centers (30,24) and (30,56), tangent
  inside the top/bottom edges, bulging to x=26.
  *Correction history:* initially read as centered (x 15..105); ph corrected 2026-06-10 —
  "the cut starts from the left" (back view). Corroboration: the side view can only dimension
  the 5.0 depth because the cutout reaches that face. Fixed in script 06.

## Assumptions register (flagged to ph, not vetoed)

- Hub centerline y=40 — mid-height; nothing dimensions it directly (consistent with the
  centered cutout height and the port at mid-height in section B-B)
- M4 clocking: one hole at 12 o'clock per hub (matches detail A hole positions)
- C'bore from the front face; csk on the boss face; the side view's "20" measures to the
  bore AXIS (verified plausible by audit probes; "from back face" confirmed by 1st-angle
  reading of the side view)
- Threads (M4-6H, G1/2-6H): no native thread feature in ClassCAD — modeled as pilot/nominal
  bores, thread specs carried here as annotations
- Tolerances modeled nominal (Ø12 +0.3/−0.1 → 12.0)

## Oddities (as-drawn, modeled faithfully — not "fixed")

- Ø8.1 ↧10 = exactly the boss thickness → blind shaft seats ending flush at the block plane
- The Ø12 chamber bore intersects no other feature (sealed except at its port mouth);
  the back cutout (z≤5) passes 9mm below the bore (z 14..26) without touching it
- The cutout notches the right side face (z 0..5, y 20..60) — visible as the 5.0 step in the
  drawing's side view

## Dimension checklist — all verified in this run

- [x] D1: 120.0 block width — block readbacks 8/8 (s02) + x=0/x=120 audit probes
- [x] D2: 80.0 block height — VD80 solved + y=0/y=80 face probes
- [x] D3: 35.0/45.0 depths — z=35 and z=45 face probes (audit)
- [x] D4: R10 ×2 left corners — tangent joins + arc centers exact (s02)
- [x] D5: Ø8 thru ×2 + ⌴Ø13.5↧8.5 — c'bore floor z=26.5 plane probe
- [x] D6: Ø45 ×2 hubs, spacing 38 — boss readbacks 7/7 (s03)
- [x] D7: R10 ×2 waist fillets — fillet centers solved to (60, 40±26.3676) exactly (s03)
- [x] D8: Ø8.1↧10 + ⌵Ø10×90° — shaft floor z=35 probe + csk rim/meeting-circle probes
- [x] D9: 6× Ø3.3↧12 / M4↧8 on Ø24 BCD @120° — M4 floor z=33 probe + top view
- [x] D10: cutout 90×40×5, left-edge-clinging + Ø8 ears — readbacks 6/6, left-wall x=30 +
      old-centered-spot-solid probes (s06; position corrected from the earlier centered read)
- [x] D11: Ø12↧100 @ (y40, z20) — bore floor x=20 plane + rim circle probes
- [x] D12: Ø18.63↧18 (G1/2) — pilot floor x=102 plane + port mouth rim probe

## Build log

### 00 — probe crash: rough arcs must still be VALID arcs

Script: `scripts/00-probe-arc-constraints.mjs` — ❌ my bug, instructive: a "rough" arc with
|start−center| ≠ |end−center| is rejected by `arcByCenter` (known zero-tolerance rule),
returned null, crashed the script downstream.
**Learned:** rough seeding ≠ sloppy geometry. Seed arcs from center+radius+two angles so the
arc is internally consistent; roughness goes into the center/radius/angle VALUES.

### 01 — probe: arc constraint machinery

Script: `scripts/01-probe-arc-constraints2.mjs` — ✅ all three answers yes:
RADIUS dim solves on arcs (r→10), COINCIDENT chains arc endpoints (gap 0.00e+0),
**TANGENT works arc-arc** (center distance → exactly r1+r2 = 30.000000).
→ Boss buildable as a constrained 4-arc chain. No trim needed; trim-on-constrained-sketch
stays an open question (not exercised in this build).

### 02 — block profile, constrained: 8/8 exact

Script: `scripts/02-block-constrained.mjs` — rough seeds (lines off by ±2–5, corner arcs seeded
r=8 and r=12!) → FIX bottom-right corner (120,0) · H/V ×4 · COINCIDENT chain ×6 ·
TANGENT line-arc ×4 · R10 ×2 · HD 120 · VD 80.
**All 8 readbacks exact to 9 decimals** (corners, tangent joins, arc centers). Extruded:
vol 334497.87.
| ![sketch](files/02-block-constrained-02-block-sketch-sketch-BlockProfile.png) | ![solid](files/02-block-constrained-02-block-sketch-solid.png) |
|---|---|

### 03 — boss peanut, constrained 4-arc chain: 7/7 exact

Script: `scripts/03-boss-constrained.mjs` — rough arcs (wrong radii 20/8/21/9, centers off) →
FIX hub1 center (41,40) · COINCIDENT chain ×4 · TANGENT ×4 at the joins ·
Ø45 ×2 · R10 ×2 · HD 38 · VD 0.
**Solver derived every tangent point and fillet center**: boss2 (79,40), fillet centers
(60, 66.367593747)/(60, 13.632406253), all 4 joins at the analytic tangent coordinates. Union vol
**365463.13 — identical**. The SKETCHING.md tangent-math sections are now optional
pre-planning tools; the solver does this.
| ![sketch](files/03-boss-constrained-03-boss-sketch-BossProfile.png) | ![solid](files/03-boss-constrained-03-boss-solid.png) |
|---|---|

### 04 — cutout, constrained: under-constraint caught by readback, then 8/8

Script: `scripts/04-cutout-constrained.mjs` — first run: **4/8**. Bottom chain exact, but
top.end / earT.center / leftL drifted (x = 15.997, 15.795…) — the scheme had no fact pinning
the left edge: ear angular extents and the left line's x floated.
**Diagnosis pattern:** partial exactness maps the missing constraints — solved-exact points
are downstream of the datum, drifted points mark the unconstrained subgraph.
**Fix:** encode the drawing fact "ears bulge outward only" as ear-center-ON-left-line
(COINCIDENT point-curve) ×2 → cascade pins everything → **8/8 exact**.
| ![sketch](files/04-cutout-constrained-04-cutout-sketch-sketch-CutoutProfile.png) |
|---|

### 05 — full constrained build: EQUIVALENT to the verified model

Script: `scripts/05-final-constrained.mjs` — three constrained sketches + the feature drillings.

- **Audit: 21/21** (all face extents, feature floors, corners, tangent vertex, hole rims)
- **Volume: 326305.89 vs 326305.89** — identical
- **COG: (59.51102224959143, 39.99852489061117, 20.18977192544782)**
- `equivalent: true && COG match: true`

| ![iso](files/05-final-constrained-05-final-iso-solid.png)       | ![top](files/05-final-constrained-05-final-top-solid.png)     |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| ![bottom](files/05-final-constrained-05-final-bottom-solid.png) | ![right](files/05-final-constrained-05-final-right-solid.png) |

### 06 — cutout position CORRECTED: clings to the back-view left edge

Script: `scripts/06-final-cutout-left.mjs` — ph caught a misinterpretation: the back cutout is
NOT centered. In the BACK VIEW it spans the **left 90** of the 120 width ("the cut starts from
the left"). Mirrored to the part frame: **x 30..120 — open at the right (port-side) face**,
ears at x=30 bulging to x=26. Corroboration: the side view can only show the 5.0 cutout depth
because the cutout reaches that face, and ph's earlier "ears on the rightmost vertices" (back
view) sits at the closed end exactly as before.

Same constraint scheme, datum moved to the drawing-meaningful bottom-left ear-join (30,20) =
120−90; the open end is tool overshoot (x→121, bottom line dimensioned 91 = 90+1).

**Data:** cutout readbacks 6/6 exact (left wall x=30). Audit **23/23** — including two new
discriminating probes: cutout LEFT wall plane at x=30 exists, and the back face at the OLD
centered location (20,40,0) is solid again. Volume 326305.15 (vs 326305.89, Δ0.0002% B-rep
noise — same cutout, new position). **COG-x 58.6722 vs predicted 58.6720**
(shift −cutVol·15/V = −0.839); y/z unchanged.

| ![bottom](files/06-final-cutout-left-06-final-bottom-solid.png) | ![iso](files/06-final-cutout-left-06-final-iso-solid.png) |
|---|---|
| ![right](files/06-final-cutout-left-06-final-right-solid.png) | ![top](files/06-final-cutout-left-06-final-top-solid.png) |

## Verdict

The conditioned rebuild reproduces the verified model exactly and re-solves on dimension change (the Ø45→Ø60 adaptivity was proven in
the investigation session): numeric equivalence at float precision,
full B-rep audit, visual match. **Script 06 supersedes 05** — it carries the corrected cutout
position (back-view left edge); scripts 02–05 remain as the method record.

## Deliverables

- **Final model (corrected cutout): `files/06-final-cutout-left-06-final-iso.stp` / `.ofb`**
- Superseded (centered cutout): `files/05-final-constrained-05-final-iso.stp`
- Constraint schemes per sketch documented in scripts 02–04, 06 (datum → relations → dims)

## Interpretation note (for the record)

The "cutout centered" reading came from an earlier interpretation round; the drawing's back
view actually places the cutout against the view's left edge (90 of the 120 width, no margin).
Mirror discipline recap: back-view-left = part-frame-RIGHT — the cutout opens onto the same
face that carries the G1/2 port (cutout z 0..5, port axis z 20 — no interaction).

## Notes for SKETCHING.md (Step: comb-through)

1. Rough-seeding rule for arcs (internally valid; roughness in values, on the correct side)
2. Under-constraint diagnosis by readback (partial exactness maps the missing facts)
3. Encode drawing language as constraints (e.g. "bulges outward only" = center-on-edge-line)
4. Datum pattern: FIX one exactly-placed corner/center point per sketch; everything else rough
5. Arc-chain profiles (COINCIDENT + TANGENT per join) avoid trim entirely when topology is known
6. Open question stays open: trim (`splitAllCurves`/`mergeBack`) on a constrained sketch
