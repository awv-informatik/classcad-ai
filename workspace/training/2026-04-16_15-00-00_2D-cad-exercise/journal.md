# 2D CAD Exercise — Replicating Technical Drawing

**Date:** 2026-04-16
**Source:** `~/desktop/2D Cad Exercise.jpeg`
**Method:** `references/SKETCHING.md`

## Goal

Recreate the technical drawing as a ClassCAD sketch. Build circle-based skeleton, trim to reveal the profile, iterate visually.

## Drawing Analysis

### Layout
- **Center/origin**: central hub Ø50 with inner hole (unlabeled — guess Ø30)
- **Above origin**: dome with 3 holes; R96 outer arc
- **Below origin**: lower body with a curved slot + central Ø40
- Axis of symmetry: vertical (X=0)

### Dimension Checklist

| # | Value | Type | Role |
|---|-------|------|------|
| D1 | Ø50 | DIAMETER | Central hub outer ring |
| D2 | Ø~30 | DIAMETER | Central hub inner hole (GUESS — not labeled) |
| D3 | 3× Ø30 | DIAMETER | 3 holes on pitch circle |
| D4 | R64 | RADIUS | Pitch circle for 3 holes (construction) |
| D5 | 60° | ANGLE | Spacing between the 3 holes |
| D6 | 30° | ANGLE | Right hole angular position from horizontal |
| D7 | 60°, 60° | ANGLE | Top extent of R96 arc (120° total, centered on vertical) |
| D8 | R96 | RADIUS | Outer dome arc (centered at origin) |
| D9 | R20 | RADIUS | Waist fillet left |
| D10 | R20 | RADIUS | Waist fillet right |
| D11 | R36 | RADIUS | Inner arc (concave waist curve?) |
| D12 | 80 | VERTICAL_DISTANCE | Origin to bottom of part |
| D13 | Ø40 | DIAMETER | Bottom central boss/hole |
| D14 | R54 | RADIUS | Outer bottom arc |
| D15 | R35 | RADIUS | Slot inner arc |
| D16 | 4× R9 | RADIUS | Slot end fillets |
| D17 | 60° TYP | ANGLE | Slot angle 1 |
| D18 | 60° TYP | ANGLE | Slot angle 2 |

### Hole angular positions (derived)

- 3 holes at 60° spacing on R64, symmetric about vertical
- Top hole at 90° (straight up, on vertical centerline)
- Left hole at 150°, right hole at 30° (from +X axis, measured CCW)
- This matches the "30°" label (right hole from horizontal) + 60° between them

### Open questions (to resolve by iteration)

- Central inner hole exact diameter — guessing Ø30
- R36 role — hypothesis varied across iterations
- R54 center — hypothesis varied (0,-26) vs (0,+6)
- 60° TYP interpretation for slot

---

## Scripts & Results

| # | Purpose | Outcome |
|---|---------|---------|
| 01 | Top skeleton: hub + 3 holes + R96 pitch | ✓ clean top layout |
| 02 | Add R54, Ø40, R35, R36 guesses | OK, too many overlapping circles |
| 03 | Full skeleton + dimensions for verification | Readable but hard to interpret |
| 04 | R36 arms tangent internal to R96, R20 solved from tangent chain | Correct placement, but all as full circles |
| 05 | Profile as ARCS (tangent chain) | FAIL: 4/6 arcs failed (radius mismatch from imprecise tangent points) |
| 06 | Refined R20c via Newton to 1e-12; full circles | Correct skeleton |
| 07 | Trim workflow (splitAllCurves → classify → trim → mergeBack) | FAIL: bug — home-circle matched by center only, so Ø50/Ø30/R96 (all at origin) collapsed. Also CSG union-of-disks wrong when R96 contains R36+R54 |
| 08 | Arcs built from CENTER + ANGLE (radius exact); R96 + R36 arms + R20 concave waist + R54 | ✓ outer profile closed — but R20 notches too deep vs source |
| 09 | Simpler: no R36 arms, just R96 → R20 → R54 | FAIL: R96 arc direction swapped; R20 tangent angle used wrong (opposite) direction for internal tangency |
| 10 | Final — script 08 geometry + 4 slot endcap lines | Reasonable outline, slot not fully detailed |

## Final-state comparison to source

What matches:
- R96 top dome (120° arc) ✓
- 3× Ø30 holes on R64 pitch circle ✓
- Central Ø50 hub + inner hole ✓
- Overall silhouette (dome + arms + waist + bottom) ✓
- R54 bottom arc ✓

What's off:
- **R20 waist interpretation is wrong.** Source shows small CONVEX R20 fillets at transition corners, not deep concave notches. My render has pronounced "hooks" at the waist.
- **R36 likely isn't body arms.** Re-examining the source, R36's arrow points INSIDE the body near the slot, suggesting it's a slot-related feature, not an arm of the outer profile.
- **Slot detail missing.** Source has an elaborate slot (2 arc bars with R9 fillets at 4 corners, 60° TYP angular spacing). My render only shows 2 concentric circles (Ø40, R35) + 4 radial lines at slot bar angles.
- **"80" dimension interpretation.** I used 80 = origin-to-bottom, giving R54 at (0,-26). Re-examining the source, 80 might be measured from the right-hole horizontal line (y=32) to bottom (y=-48), which would put R54 at (0,+6).
- **Central inner hole size** — guessed Ø30, unconfirmed from drawing.

## What would need to happen to get it right

1. Resolve "80" reference line precisely — re-measure drawing
2. Re-interpret R20 as convex corner fillet, not concave waist notch
3. Figure out where R36 actually belongs (slot outer? body arm?)
4. Model the slot fully: 2 annular bars between Ø40 and R35, 60° openings at top/bottom, R9 fillets at the 4 opening corners (requires solving fillet geometry since slot width (15) < fillet diameter (18))
5. Iterate with dimensions enabled so values can be cross-checked against source

