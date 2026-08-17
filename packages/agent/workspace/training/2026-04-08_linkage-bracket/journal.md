# Linkage Bracket — Curve API Recreation

**Goal:** Recreate the dimensioned 2D linkage bracket drawing using the ClassCAD curve API. Not a standard training session — this is a freeform geometry construction exercise.

**Approach:** Inside-out. Place holes first, then slots, then outline. Use booleans to trim and connect.

---

## Step 1: Geometric Analysis

### Dimensioned Features from Drawing

**Diameters (holes / construction circles):**
| Label | Diameter | Radius | Likely role |
|-------|----------|--------|-------------|
| Ø0.750 | 0.750 | 0.375 | Small hole, upper area |
| Ø1.625 | 1.625 | 0.8125 | Medium hole, center-upper |
| Ø1.125 | 1.125 | 0.5625 | Medium hole, center |
| Ø1.750 | 1.750 | 0.875 | Construction circle — bottom outline arc |

**Radii (arcs forming outline/features):**
| Label | Radius | Count | Location / role |
|-------|--------|-------|-----------------|
| R1.750 | 1.750 | 1 | Top outline — large concave arc connecting left to center |
| R0.750 | 0.750 | 2 | Left oblong slot semicircular ends |
| R0.437 | 0.437 | 2 | Bottom-left outline transition fillets |
| R0.625 | 0.625 | 2 | Right oblong slot semicircular ends |
| R0.438 | 0.438 | 2 | Right area — outline fillets near right slot |
| R1.375 | 1.375 | 1 | Bottom-right outline arc |
| R0.875 | 0.875 | 2 | Right boss outline arcs |

**Linear dimensions:**
| Value | Direction | Meaning (interpretation) |
|-------|-----------|--------------------------|
| 5.804 | Horizontal | Total width, leftmost to rightmost point |
| 1.875 | Vertical | Full height at the left edge |
| 1.000 | Horizontal | Left edge → center of left slot |
| 2.312 | Horizontal | Center of bottom construction circle (Ø1.750) → center of right boss |
| 0.750 | Horizontal | Horizontal offset between Ø1.625 center and Ø0.750 center |

**Angles:**
| Value | Location | Meaning |
|-------|----------|---------|
| 40° | Right side | Orientation of right oblong slot from horizontal |

### Coordinate System

**Origin:** Left edge of part, on horizontal centerline.
- X → right, Y → up
- All coordinates in inches (matching drawing units)

### Derived Positions (Version 1 — to be refined through iteration)

**Reasoning:**
- Left slot center at x=1.000 (from 1.000 dim)
- Total width 5.804 → rightmost point at x=5.804
- Right boss: R.875 outline → center at x ≈ 5.804 - 0.875 = 4.929
- 2.312 from Ø1.750 center to right boss center: Ø1.750 center at x = 4.929 - 2.312 = 2.617
- Height at left = 1.875 → top at y=+0.9375, bottom at y=-0.9375
- 0.750 horizontal offset → Ø0.750 center at x = Ø1.625_x + 0.750

**Position Table (V1):**
| Feature | cx | cy | r | Notes |
|---------|----|----|---|-------|
| Left slot center | 1.000 | 0.000 | — | Center of oblong |
| Left slot L-cap | 0.625 | 0.000 | 0.750 | Semicircle center |
| Left slot R-cap | 1.375 | 0.000 | 0.750 | Semicircle center |
| Ø1.625 hole | 2.125 | 0.125 | 0.8125 | Slightly above centerline |
| Ø0.750 hole | 2.875 | 0.875 | 0.375 | 0.750 right of Ø1.625 |
| Ø1.125 hole | 2.617 | -0.125 | 0.5625 | Near Ø1.750 center x |
| Ø1.750 constr. | 2.617 | -0.625 | 0.875 | Bottom outline arc |
| Right boss center | 4.929 | 0.000 | — | Center of right lobe |
| R1.375 center | TBD | TBD | 1.375 | Bottom-right outline |
| R1.750 center | TBD | TBD | 1.750 | Top outline |

**Key uncertainties:**
- Exact y-coordinates of Ø1.625, Ø0.750, Ø1.125
- Left slot half-length (distance between semicircle centers)
- All outline arc centers (will derive from tangency)
- Right slot position and orientation details

### Construction Plan

1. **Holes first** — Ø0.750, Ø1.625, Ø1.125 as full circles
2. **Left slot** — stadium shape (2 semicircles + 2 lines, or polyline2d with bulges)
3. **Right slot** — similar but rotated 40°
4. **Outline** — build from circular arcs, trim with booleans
5. **Final assembly** — union outline, subtract holes and slots

---

## Key Findings

### Bulge Convention (polyline2d)
- **Positive bulge = OUTWARD** (arc to LEFT of chord direction in standard 2D view, for CCW traversal)
- **Negative bulge = INWARD** (arc to RIGHT of chord direction)
- Stadium: `bulges: [0, 1, 0, 1]` for outward semicircles
- Circle from 4 points: all positive `0.414` bulges

### arcBy3Points vs arcByCenter
- `arcByCenter` with `isClockwise` is unreliable for selecting major/minor arc — gave wrong arc for R1.750
- **`arcBy3Points` works perfectly** — midPos uniquely determines which arc

### Rendering in one vs multiple shapes
- Arcs in a SINGLE shape only partially render (right side was invisible)
- Arcs in SEPARATE shapes all render correctly
- But polyline2d (all in one closed polyline) works for both rendering AND booleans

### Boolean subtraction
- Requires CLOSED shapes — individual arcs+lines in one shape don't form a recognized closed loop
- **polyline2d with close=true** creates properly closed shapes ✓
- Booleans (subtraction2d) work on polyline2d shapes ✓

### Tangent Chain Computation
- Solved R1.375 and R.437 centers numerically (quadratic equation from two tangency constraints)
- External tangency: dist(C1, C2) = R1 + R2
- For bottom outline, external tangency places R1.375 center BELOW the outline → concave arc
- Internal tangency impossible (centers too far apart for |R1-R2|)
- The bottom outline has subtle concavities at the transitions — matches some bracket designs

### Unit System
- ClassCAD works in mm. Drawing dimensions are in inches.
- Conversion: `const IN = 25.4` applied to all values
- Small values (< 1mm) render as blocky polygons — always convert to mm

## Script Log

### Scripts 01-08: Iteration on polygon approximation
- Placed circles at estimated positions (Scripts 01-03)
- Polygon outline with polyline2d (Scripts 04-08)
- Discovered bulge convention, mm conversion, rendering quirks

### Scripts 09-13: Individual arc segments
- Built outline from arcByCenter calls — discovered isClockwise ambiguity
- Split right boss arc into 2 halves — still wrong arc direction
- Switched to arcBy3Points — all arcs render correctly

### Scripts 14-16: Tangent chain
- Computed exact tangent points between adjacent arcs
- Bottom outline: R.750bot → R.437 → Ø1.750 → R1.375 → R.875

### Scripts 17-19: Boolean operations
- cleanShape failed (wrong param name)
- Individual arcs don't form "closed" shape for booleans
- polyline2d with close=true + booleans: WORKS ✓

### Scripts 20-22: Final assembly
- Bulge sign test confirmed: positive = outward
- Complete bracket with precise tangent chain + all booleans: SUCCESS
- Current state: bracket with slot and 3 holes, recognizable shape

