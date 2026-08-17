# Build: Lever Bracket (decimal-inch practice drawing)

**Date:** 2026-06-10
**Type:** Constraint-driven reproduction of a 2D technical drawing (plate part).
**Units:** decimal inches, modeled as raw values. Plate thickness NOT specified by the
drawing — extruded 0.5 for visualization (flagged assumption).
**Method:** SKETCHING.md as prescribed — natural shapes at rough positions, datum + drawing
dimensions drive the solver, tangency derives every transition, trim by boundary classifier.

## Locked interpretation (datum: main boss center at origin; X right, Y up)

All six open questions resolved by ph (2026-06-10):

- **Main boss** Ø1.750 / bore Ø1.125 at (0,0). Oblong centerline COLLINEAR with main-boss
  centerline (y=0).
- **Top boss** Ø1.625 / hole Ø.750 at (−.750, +1.875): .750 horizontal center-to-center
  (top boss left of main), 1.875 vertical from the y=0 centerline.
- **Left oblong**: caps R.750, cap centers 1.000 apart on y=0; inner slot caps R.437 (same
  centers) + tangent lines. Left cap at x = −1.867 (derived: 3.187 + .750 − 5.804).
- **Right lobe/slot**: slot centerline arc centered at ORIGIN, radius 2.312; lower cap center
  at 0° → (2.312, 0); upper cap at 40° (radials from main center, lower = horizontal).
  Slot caps R.438; lobe end caps R.875 at the same centers. Lobe outer arc and slot arcs are
  TANGENCY-DERIVED (expected: 3.187 outer; 1.874/2.750 slot).
- **Transitions** (all tangency-driven): R1.750 (oblong right cap ↔ top boss),
  2× R.625 (top boss ↔ upper lobe cap; main boss ↔ upper lobe cap — per ph: the twin is the
  neck from the upper lobe area into the main-boss region), R1.375 (main boss ↔ lower lobe
  cap, bottom), straight tangent web lines (oblong caps top/bottom, oblong right cap ↔ main
  boss bottom).
- **5.804 demoted to a CHECK**: it spans tangent extremes (not centers), so the left cap is
  driven at 1.867 from datum and 5.804 is verified by readback: leftmost = leftCap.x − .750,
  rightmost = +3.187.

## Driving dimensions (the drawing's own numbers)

Ø1.750, Ø1.125, Ø1.625, Ø.750 · R.750×2, R.437×2 · R.438×2, R.875×2 · R.625×2, R1.375,
R1.750 · .750, 1.875, 1.000, 2.312, 40° · (1.867 standing in for 5.804)

## Dimension checklist

- [ ] D1: Ø1.750 / Ø1.125 main boss + bore
- [ ] D2: Ø1.625 / Ø.750 top boss + hole at (−.750, 1.875)
- [ ] D3: oblong R.750×2 caps @ 1.000, inner R.437×2, on y=0
- [ ] D4: slot cap centers at r=2.312, 0° and 40°
- [ ] D5: slot caps R.438 + tangency-derived slot arcs (1.874 / 2.750)
- [ ] D6: lobe caps R.875 + tangency-derived outer arc (3.187)
- [ ] D7: R1.750 transition solved tangent
- [ ] D8: 2× R.625 necks solved tangent
- [ ] D9: R1.375 bottom neck solved tangent
- [ ] D10: web tangent lines (oblong, oblong↔main)
- [ ] D11: 5.804 overall extent (readback check)
- [ ] D12: outer contour trims to a single closed loop; slots/holes subtract cleanly

## Build log

### 01 — constrained layout: 14/14 exact

Script: `scripts/01-layout-constrained.mjs` — full primary layout from rough seeds:
datum FIX at main center, all drawing dims driving, tangency deriving the rest.
**All 14 checks exact (1e-6):** five centers, four fillet tri-tangency centers vs analytic,
lobe envelope radius, three line tangency residuals, and the 5.804 overall-extent readback.
**New API finding:** circle-circle TANGENT solves to INTERNAL tangency when seeded there —
the lobe outer envelope (seed r=3.0) solved to r=3.187 ENCLOSING both caps (d = R−r).
constraint.md documented only external (d = r1+r2). 📌 doc update.
The 40° scheme via helper radials (hl1 horizontal, hl2 with OFFSET 2.312 + ANGLE '40deg')
placed the upper cap center exactly.

### 02 — trim on the heavy constrained sketch HANGS the worker

Script: `scripts/02-outer-trim.mjs` — splitAllCurves: 66 segments; boundary classifier
selected 39 to trim; `trimCurves` with 39 IDs → worker pegged at ~99% CPU, no return —
reproduced twice (30s harness timeout AND --debug with a 5-minute cap). kill -9 required.
**Finding (TODO.md): trimCurves on a sketch with ~20 constraints + 20 dims and 66 staged
segments hangs the server.** The verified trim workflow (trim-vs-constraints session) used
≤13 segments — scale matters. 📌 TODO entry + splitAllCurves.md warning.

### 03 — layout v2 (necks re-targeted): 14/14

Script: `scripts/03-layout-v2.mjs` — f625a re-targeted to topO↔mainO after loop-topology
analysis; solved to (0.597983, 1.375651), matching analytic. All 14 checks exact again.

### 04 — derived exact chain: extrusion rejects the loop → topology impasse

Script: `scripts/04-derived-solid.mjs` — 14-element boundary chain computed from SOLVED
master data (every tangent point analytic), built exact in a second sketch (no trim).
Chain built 14/14, Green's-theorem area = 16.112997 in². **Extrusion maxLevel 51 — and the
cause is real: the two R.625 fillet circles (topO↔mainO at (.598,1.376) and mainO↔upCap at
(.271,1.475)) INTERSECT at (.259,.850), both arcs cross → self-intersecting loop.**

**Topology elimination (all candidates fail with the locked dimensions):**
- f625a=topO↔upCap & f625b=mainO↔upCap → upper cap carries 3 boundary tangencies
  (lobe osculation 40°, f625a 142.2°, f625b 180.4°) — odd valence, no simple loop.
- f625a=topO↔mainO & f625b=mainO↔upCap → the two fillet arcs cross (verified numerically).
- f625a=topO↔lobeOuter (internal, T at 77.8°) → outer arc must continue past its 40°
  osculation with the upper cap → 3-valent cusp vertex — non-manifold.
- Void spoke (lobe band connected only via necks, inner envelope r=1.437 as boundary) →
  lower cap becomes 3-valent; also f625b↔innerRing tangency distance is contradictory.

⇒ At least one attachment assumption is wrong. Paused to ask ph (per SOUL: ask, don't
fabricate). Everything OUTSIDE the topO/mainO/upCap pocket is verified and closes.
