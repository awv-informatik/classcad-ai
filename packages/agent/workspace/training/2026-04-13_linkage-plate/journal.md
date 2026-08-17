# Training: Linkage Plate Sketch Reproduction

**Date:** 2026-04-13

## Goal

Recreate a complex linkage plate technical drawing in ClassCAD. The profile is primarily defined by tangent arcs (circle-derived) with extensive trimming. Dimensions in inches.

**Source:** conversation attachment (linkage plate technical drawing)

## Dimension Inventory

### Diameters (through-holes)

| # | Annotation | Value | Description |
|---|-----------|-------|-------------|
| D1 | Ø0.750 | 0.750 | Small hole, upper area |
| D2 | Ø1.625 | 1.625 | Medium hole, upper area (concentric with Ø0.750?) |
| D3 | Ø1.125 | 1.125 | Hole, lower-center area |
| D4 | Ø1.750 | 1.750 | Large hole, lower area |

### Radii (profile arcs)

| # | Annotation | Value | Count | Description |
|---|-----------|-------|-------|-------------|
| R1 | R1.750 | 1.750 | 1 | Large profile arc, upper-left area |
| R2 | 2x R.750 | 0.750 | 2 | Left lobe rounded ends (top + bottom) |
| R3 | 2x R.437 | 0.437 | 2 | Left lobe inner slot ends |
| R4 | R1.375 | 1.375 | 1 | Lower-right profile arc |
| R5 | 2x R.625 | 0.625 | 2 | Upper-right transition arcs |
| R6 | 2x R.438 | 0.438 | 2 | Right arm transition arcs |
| R7 | 2x R.875 | 0.875 | 2 | Right arm outer curves |

### Linear Dimensions

| # | Value | Type | Description |
|---|-------|------|-------------|
| L1 | .750 | VERTICAL | Top reference — centerline to Ø1.625/Ø0.750 center |
| L2 | 1.875 | VERTICAL | Height at left side (left lobe total) |
| L3 | 1.000 | HORIZONTAL | Left lobe center to Ø1.750 center (horizontal) |
| L4 | 2.312 | HORIZONTAL | Ø1.750 center to R1.375 reference (horizontal) |
| L5 | 5.804 | HORIZONTAL | Overall width |

### Angles

| # | Value | Description |
|---|-------|-------------|
| A1 | 40° | Right arm angle from horizontal |

## Coordinate System

Origin at **left edge of part**, horizontal centerline at **y = 0**.

### Derived Positions

**Left lobe (from L2 = 1.875, R2 = R.750):**
- Lobe height = 1.875 = 2 × R.750 + 2 × y_arc_center → y_arc_center = (1.875 - 1.500) / 2 = 0.1875
- R.750 arc centers: (0.750, ±0.1875) — left edge at x = 0.750 - 0.750 = 0 ✓
- R.437 slot arcs: same centers (0.750, ±0.1875), concentric with smaller radius

**Main vertical axis (from L3 = 1.000):**
- Vertical construction line at x = 0.750 + 1.000 = 1.750
- Ø1.750 center: (1.750, y_1750)
- Ø1.625 + Ø0.750 center: (1.750, 0.750) — from L1 = .750 above centerline

**R1.375 position (from L4 = 2.312):**
- R1.375 reference at x = 1.750 + 2.312 = 4.062

**Right extent:** 5.804 total → right edge at x = 5.804

### Dimension Checklist

- [ ] D1: Ø0.750 — DIAMETER — small through-hole
- [ ] D2: Ø1.625 — DIAMETER — medium through-hole
- [ ] D3: Ø1.125 — DIAMETER — hole, lower area
- [ ] D4: Ø1.750 — DIAMETER — large hole, lower area
- [ ] R1: R1.750 — RADIUS — large profile arc
- [ ] R2: 2x R.750 — RADIUS — left lobe ends (×2)
- [ ] R3: 2x R.437 — RADIUS — inner slot ends (×2)
- [ ] R4: R1.375 — RADIUS — lower-right arc
- [ ] R5: 2x R.625 — RADIUS — upper-right transitions (×2)
- [ ] R6: 2x R.438 — RADIUS — right arm transitions (×2)
- [ ] R7: 2x R.875 — RADIUS — right arm curves (×2)
- [ ] L1: .750 — VERTICAL — centerline to upper feature center
- [ ] L2: 1.875 — VERTICAL — left lobe height
- [ ] L3: 1.000 — HORIZONTAL — lobe center to main axis
- [ ] L4: 2.312 — HORIZONTAL — main axis to R1.375 reference
- [ ] L5: 5.804 — HORIZONTAL — overall width
- [ ] A1: 40° — ANGLE — right arm angle

## Scripts Log

(entries added as scripts are written and run)
