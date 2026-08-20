# Training: multi-loop extrusion — profiles with holes (TODO #173)

**Date:** 2026-08-19
**Trigger:** spanner e2e run — agent didn't know how to extrude a plate-with-hole as
one profile, called the region/curve guidance "conflicting", fell back to curves +
boolean subtract. extrusion.md documents region ids and curve ids both work, and
"multiple regions = multiple bodies", but the nested-loop (hole) case is untrained.

## Goal

Measure how ClassCAD handles profiles with inner loops (holes) in `part.extrusion`.

**Methods to cover:**

- `part.extrusion` — `references` with: outer curve only; outer + inner curves;
  region id(s) for nested-loop sketches
- `part.getSketchRegion` — naming and return for nested-loop sketches
- Structure tree — what region objects a nested-loop sketch produces

**Questions (each → a named script):**

1. Two concentric circles in one sketch: what regions appear in the tree? Extruding
   [outer] vs [outer, inner] vs region-id — solid disk, annulus, or two bodies?
   Volumes at r=30/r=10, h=10: disk 28274.33, annulus 25132.74, disk+plug-two-bodies
   sums 31415.93 — three distinct signatures. → 01-nested-circles.mjs
2. Practical case: rectangle 100×60 + two Ø16 holes, h=10 — plate-with-holes volume
   55978.76 vs solid 60000. Curves path vs region path; getSketchRegion by name.
   → 02-plate-with-holes.mjs
3. Deeper nesting (island inside a hole) + region naming/return details.
   → 03-islands.mjs

**Verification:** volume (Tier 1) discriminates every interpretation; body count via
graphic containers. No visual-only claims.

## Journal

### Run 01 — 01-nested-circles.mjs

- Tree has **no region nodes** after sketching two concentric circles (regions are
  not pre-built).
- `references: [outer]` → solid disk, vol 28273.77 (analytic 28274.33), 1 body.
- `references: [outer, inner]` → **annulus, vol 25131.91 (analytic 25132.74), ONE
  body** — nested loops auto-subtract. This is the core answer to TODO #173.

### Run 02 — 02-plate-with-holes.mjs

- Rect lines + 2 hole circles in one `references` → plate with holes, vol 55977.92
  (analytic 55978.76), 1 body.
- **`CC_SketchRegion` appears AFTER the extrusion** (child of the sketch, name
  "SketchRegion"); `getSketchRegion({ id: part, name: 'SketchRegion' })` → its id;
  guessed names (Region, Region1, SketchRegion1) → null/51.
- Side-finding: `updateExtrusion` adding a reference to the committed feature →
  error 1200 "not allowed to update. It's not active and open". Param-only updates
  (limit2) were verified working 2026-08-17 (ar15 session) — reference edits appear
  to need the feature open. Not investigated further.

### Run 03 — 03-islands.mjs

- **Islands work (even-odd containment)**: [r40, r20, r8] → annulus + island, vol
  39706.74 (analytic 39709.73). Graphic containers reported 1 — container count is
  NOT reliable body-count evidence here (2 disjoint solids expected; volume is the
  probe that proves both exist). Flagged, not settled.
- **Straddling loop = hard error**: hole centered on the outline → error 1121
  "Curves ... self intersect at least at position {50,-8,0}" — AND a feature id is
  still returned at maxLevel 51 → must `deleteFeature` (same broken-feature pattern
  as not-manifold).
- **Region id as reference works**: extruding the post-extrusion CC_SketchRegion id
  re-extrudes the same multi-loop profile, holes included (base 10429.05, both
  directions 20858.97 = exactly doubled).

### Run 04 — 04-order-disjoint.mjs

- **Loop order irrelevant**: [inner, outer] → annulus 25131.91, identical.
- **Disjoint outers + their holes in ONE call**: two plates each with a hole →
  22429.23 (analytic 22429.20) — each hole assigned to its containing outer.

## Coverage check

- [x] Q1 nested circles: regions (none pre-extrude), outer-only vs both vs region → 01, 03c
- [x] Q2 plate with holes, curves + getSketchRegion → 02
- [x] Q3 islands, straddling edge case, region naming/reuse → 03
- [x] Bonus: loop order, disjoint multi-outer → 04

## Skill Updates

`references/part/extrusion.md` — new section "Profiles with holes (multi-loop)"
with all measured facts + pointer from the `references` param bullet; the 1200
updateExtrusion caveat noted with exactly what was measured. TODO #173 closed.
