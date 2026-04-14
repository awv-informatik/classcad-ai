# Sketching Guide — Reproducing Technical Drawings in ClassCAD

A practical guide for LLMs that need to parse 2D technical drawings and recreate them as ClassCAD sketches. Distilled from multiple reproduction exercises ranging from simple bracket plates to complex linkage plates with 16+ intersecting circles.

## The Method

The single most important insight: **don't try to draw the final profile directly.** Instead, follow this pipeline:

```
1. Analyze → 2. Checklist → 3. Circles → 4. Dimensions → 5. Trim → 6. Evaluate → 7. Iterate
```

Each step is described below.

---

## Step 1 — Analyze the Technical Drawing

Read the drawing systematically. Don't start coding until you've identified every annotation.

### What to extract

| Category | What to look for |
|----------|-----------------|
| Diameters (Ø) | Through-holes, bores, bosses. Note "3×Ø17" = 3 instances |
| Radii (R) | Profile arcs, fillets, transitions. Note "2× R.750" = 2 instances |
| Linear dimensions | Horizontal, vertical, offset distances |
| Angles | Between construction lines, arms, features |
| Center marks (+) | Gray crosshairs indicate circle centers — count them |
| Centerlines (dashed) | Construction geometry — horizontal, vertical, angled axes |
| Concentric circles | Multiple annotations at the same center (e.g., Ø25, Ø26, Ø38) |

### Cross-reference dimensions

This is where most of the value is. Don't treat dimensions independently — cross-reference them to derive positions:

```
14° angle + 48 horizontal distance → tan(14°) × 48 = 12 → vertical offset
12 + 8.5 (boss radius) = 20.5 → matches the 20.5 dimension ✓
6.75 / sin(13°) = 30.0 → distance to top boss
30.0 × cos(13°) = 29.23 → vertical position
29.23 + 20.5 = 49.73 → matches the 49.73 dimension ✓
```

When dimensions chain together like this, you've found the correct interpretation. If a dimension doesn't fit, your interpretation is wrong.

### Common traps

- **Ø vs R confusion**: Ø38 means diameter 38 (radius 19). R1.750 means radius 1.750 directly.
- **"3×" prefix**: means 3 instances of the same feature, not a multiplier on the dimension.
- **Low-resolution images**: Ø25 and Ø26 concentric circles (0.5mm wall) are nearly indistinguishable. Ø28 and Ø38 look similar. Ask the user when uncertain.
- **Dimension reference points**: 48 might measure to a boss center, a bounding box edge, or a tangent line endpoint. Cross-referencing resolves which.
- **Feature-locating vs overall dimensions**: 49.73 from a datum to a boss CENTER (not to the part edge) is standard practice. Not all dimensions go edge-to-edge.

---

## Step 2 — Build the Dimension Checklist

Before writing any code, create a checklist in the journal. Every dimension in the drawing gets a row:

```markdown
- [ ] D1: Ø38 — DIAMETER — central hub outer circle
- [ ] D2: 48 (left) — HORIZONTAL_DISTANCE — hub to boss center
- [ ] D3: 14° — ANGLE — arm angle from horizontal
...
```

**Format**: `[ ] <name> <type> <what it controls>`

This checklist serves three purposes:
1. **Completeness check** — forces you to account for every annotation
2. **Evaluation gate** — after building, check each box only when verified
3. **Iteration tracker** — unchecked items tell you what's still wrong

---

## Step 3 — Recognize the Original Shapes

The key insight: **what you see in a technical drawing is not what was drawn.** The visible profile is the result of trimming simpler, natural shapes — circles, lines, arcs — at their intersection points. An organic-looking contour is really just a handful of overlapping circles with the interior segments removed.

If you can recognize the original shapes BEFORE trimming, reconstruction becomes straightforward: place the shapes, then trim. If you try to trace the final profile directly, you're working backwards and errors compound.

### How to see through the trim

Look for these clues:
- **Center marks (+)**: every gray crosshair is the center of a circle or arc. Count them — that's your circle count.
- **Radius annotations (R)**: each R value is a circle. R1.750 means there's a full circle of radius 1.750 somewhere, and only a portion of it survived trimming.
- **Diameter annotations (Ø)**: through-holes and bosses. These are complete circles (untrimmed).
- **Tangent transitions**: where two curves meet smoothly, two circles are tangent. The visible arc is the trimmed remainder of each.
- **Fillet radii**: small R values at transitions are small circles tangent to two larger shapes.

### Decompose the drawing into natural shapes

Before coding, list every original shape. A typical mechanical part:

| Visible feature | Original shapes |
|----------------|----------------|
| Oblong/slot | 2 circles (ends) + 2 tangent lines (sides), or 4 circles if inner slot |
| Smooth body contour | 1–2 large circles, trimmed to arcs |
| Boss with hole | 2 concentric circles |
| Arm at an angle | 2 circles (tip ends) + 2 circles (base/waist) + fillet circles at transitions |
| Fillet between features | 1 small circle tangent to both adjacent shapes |

### Place the full shapes first, trim later

Don't draw arcs. Don't try to compute tangent points. Place every circle and line at its full extent:

```js
const noGen = { genFixation: false, genIncidence: false,
                genVertAndHoriz: false, genTangency: false }
await api.v1.sketch.circle({
  id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen
})
```

Disable auto-constraints — they interfere with precise programmatic placement.

This gives you a "skeleton" of overlapping shapes. Compare it against the source — you should be able to visually trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, your positions are wrong. Fix them before trimming.

If the circles don't match the source proportions, your center positions are wrong. Fix positions before proceeding.

---

## Step 4 — Add Dimensions

Add ClassCAD dimensions to the circles. This does two things:
1. **Verifies positions** — auto-calculated dimension values should match the source
2. **Makes the drawing readable** — dimensions appear in the snapshot

### Common dimension patterns

```js
// Diameter on a circle
await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circleId] })

// Horizontal distance between circle centers
const ptA = (await api.v1.sketch.getPoints({ id: circleA })).result.centerId
const ptB = (await api.v1.sketch.getPoints({ id: circleB })).result.centerId
await api.v1.sketch.dimension({
  id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [ptA, ptB]
})

// Angle between two lines
await api.v1.sketch.dimension({
  id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [x, y, 0]
})
```

### Key gotchas

- `HORIZONTAL_DISTANCE` and `VERTICAL_DISTANCE` with 2 geomIds: **both must be points**, not lines or circles. Use `getPoints(circleId).centerId` to extract center point IDs.
- `ANGLE` works with non-intersecting lines — the solver extends them to find the virtual intersection.
- `OFFSET` between parallel lines measures perpendicular distance, even if lines don't overlap.
- The `value` parameter at creation is **broken** — use `updateDimension` after creation to set values.
- `dimPos` for ANGLE selects which of the 4 angle sectors to constrain. Place it in the desired quadrant.

---

## Step 5 — Trim

Once all circles are positioned and dimensioned, trim them to create the profile.

### The trim workflow

```js
// 1. Split all curves at intersection points (staged — nothing visible changes)
const segments = (await api.v1.sketch.splitAllCurves({ id: skId })).result

// 2. Mark segments for removal (still staged)
await api.v1.sketch.trimCurves({ id: skId, curveIds: segmentsToRemove })

// 3. Apply trims (now geometry actually changes)
await api.v1.sketch.splitCurvesMergeBack({ id: skId })
```

### Identifying which segments to trim

With N circles, `splitAllCurves` can return 50–130+ segments. You need to classify each one.

**Programmatic approach**: for each segment, compute its arc midpoint and check if it's inside any other contour circle:

```js
for (const segId of segments) {
  const pos = await api.v1.sketch.getPositions({ id: segId })
  // Compute arc midpoint, match to parent circle, check against others
  // If midpoint is inside another contour circle → trim it
}
```

**Circle roles matter**:
- **Contour circles** (R values): trim segments that are inside other contour circles
- **Hole circles** (Ø values): keep as-is (they're entirely inside the body)
- **Slot circles**: keep segments inside the body contour, trim the rest

### Critical trim rules

- `trimCurves` ONLY works with IDs from `splitAllCurves` — not original circle IDs
- `trimCurves` is **atomic** — one bad ID fails the entire call
- After `mergeBack`, all trimmed curve IDs become invalid — call `getGeometry` for new IDs
- Calling `splitAllCurves → mergeBack` with no trim in between is a safe no-op

---

## Step 6 — Add Constraints

Constraints declare geometric relationships. They don't move geometry (the solver doesn't run), but they encode design intent.

```js
// Concentric (shared center)
await api.v1.sketch.constraint({
  id: skId, type: 'CONCENTRIC', geomIds: [circle1, circle2]
})

// Tangent (line touches circle)
await api.v1.sketch.constraint({
  id: skId, type: 'TANGENT', geomIds: [lineId, circleId]
})

// Horizontal / Vertical
await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
```

### Key facts about constraints

- **Constraints never reposition geometry.** They're metadata only.
- No conflict detection — contradictory constraints are silently accepted.
- No redundancy detection — duplicate constraints create duplicate objects.
- SYMMETRY requires axis line FIRST: `geomIds: [axisLine, geom1, geom2]`
- Constraints are stored in the structure tree as `CC_2D*Constraint` nodes.
- The renderer draws them as colored badges if the `extractConstraints` logic includes them.
- Auto-generated constraints (from `genFixation`, `genIncidence`, etc.) are named `Auto_*` and filtered from rendering.

---

## Step 7 — Evaluate and Iterate

### Eval pass 1: Checklist verification

For each dimension in the checklist, verify the actual value matches the expected value. Compute from the placed geometry:

```js
const angle = Math.atan2(Math.abs(bossY), Math.abs(bossX)) * 180 / Math.PI
// Check: angle ≈ 14° ✓
```

Only check the box if the value matches within tolerance.

### Eval pass 2: Visual comparison

Snapshot the sketch and compare side-by-side with the source drawing. Check:
- Overall proportions
- Circle sizes relative to each other
- Feature positions (centered? offset?)
- Profile shape (after trimming)

### When to iterate

- Unchecked dimensions → fix positions
- Visual mismatch → adjust circle centers or radii
- Profile gaps → fix trim classification
- Labels overlapping geometry → the renderer's de-overlap handles this

---

## Tangent Line Computation

For parts with straight edges between circular features (like the bracket plate's triangular outline), compute external tangent lines between equal-radius circles:

```js
function outerTangent(A, B, r) {
  // A, B = circle centers [x, y], r = shared radius
  const d = normalize(sub(B, A))
  const p = perp(d)  // 90° CCW
  const mid = scale(add(A, B), 0.5)
  // Choose perpendicular direction pointing AWAY from body center
  const outerP = (len(add(mid, p)) > len(sub(mid, p))) ? p : scale(p, -1)
  return [add(A, scale(outerP, r)), add(B, scale(outerP, r))]
}
```

For different-radius circles, the tangent computation is more complex — use the standard external/internal tangent formulas based on center-to-center distance vs sum/difference of radii.

---

## Arm/Wall Computation

For narrow arms connecting a hub to bosses (width W, hub radius R_h, boss radius R_b):

```js
const dir = normalize(bossCenter)  // hub at origin
const perp = [-dir[1], dir[0]]
const armHW = W / 2  // half-width

// Intersection of arm wall with hub circle
const tHub = Math.sqrt(R_h ** 2 - armHW ** 2)
const hubPt = add(scale(perp, armHW), scale(dir, tHub))

// Intersection with boss circle (solve quadratic)
const offset = scale(perp, armHW)
const v = sub(offset, bossCenter)
const b = 2 * dot(v, dir)
const c = dot(v, v) - R_b ** 2
const tBoss = (-b - Math.sqrt(b * b - 4 * c)) / 2
const bossPt = add(offset, scale(dir, tBoss))

await api.v1.sketch.line({ id: skId, startPos: [...hubPt, 0], endPos: [...bossPt, 0] })
```

---

## Tangency Constraints for Circle Center Computation

When a drawing doesn't give explicit coordinates for circle centers, derive them from tangency conditions. Two tangent circles satisfy:

| Tangent type | Center distance |
|-------------|----------------|
| External (both convex, same side) | d = R₁ + R₂ |
| Internal (one contains the other) | d = |R₁ − R₂| |

Two tangency conditions give two equations in two unknowns (x, y) — solve the system of two circle equations to find the center.

Example: R1.750 tangent to R.750 (external, d=2.500) AND tangent to Ø1.625 (external, d=2.5625):

```
(x − 0.750)² + (y − 0.1875)² = 6.25      // tangent to R.750
(x − 1.750)² + (y − 0.750)²  = 6.566     // tangent to Ø1.625
```

Subtract to get a linear equation, substitute back, solve the quadratic. Two solutions — pick the one that makes geometric sense (check which side of the profile the center should be on).

---

## Lessons Learned

### What worked well

1. **Dimension cross-referencing** was the single most valuable technique. When `tan(14°) × 48 = 12` and `12 + 8.5 = 20.5` matches a third dimension, you know the interpretation is correct.

2. **Everything-is-circles** simplified complex profiles from "how do I draw this organic curve?" to "where are the 16 circle centers?" — a much more tractable problem.

3. **Checklist-driven evaluation** prevented false confidence. Without checking each dimension against the actual geometry, it's easy to think the sketch is correct when it's not.

4. **Dimensions early** (before trimming) let ClassCAD's auto-calculated values verify positions. If a dimension shows 47.8 instead of 48, the circle center is off.

5. **Iterative refinement** with snapshots at each step. Don't try to build the complete drawing in one pass.

### What didn't work

1. **Drawing arcs directly** between computed tangent points. This requires getting every tangent point exactly right, and errors compound. Full circles + trim is much more forgiving.

2. **Analytical position computation** for all circles simultaneously. With 16 circles and 12+ tangency conditions, the system is over-determined and hard to solve manually. Place circles approximately, use dimensions to verify, iterate.

3. **Moving just the labels** away from geometry — disconnecting labels from their dimension lines makes the drawing harder to read, not easier. Move entire dimensions (lines + arrows + labels) as a unit, or don't move them at all.

### What to watch out for

- **Z must be 0** for all sketch geometry. Non-zero Z → error 1014.
- **Disable all gen\* flags** when placing geometry programmatically. Auto-constraints interfere with precise positioning.
- **getPositions fails on circle IDs** — use `getPoints(circleId).centerId` then `getPositions(centerId)`.
- **Constraints don't reposition geometry** — they're declarative metadata only.
- **The `value` param on `dimension()` is broken** — always create first, then `updateDimension`.
- **splitAllCurves ≠ splitCurves** — completely different operations. Only `splitAllCurves` works with `trimCurves`.
- **trimCurves is atomic** — one invalid ID fails the entire call.

---

## Related

- [sketch/constraint.md](sketch/constraint.md) — geometric constraints
- [sketch/dimension.md](sketch/dimension.md) — dimensional constraints (with practical patterns)
- [sketch/circle.md](sketch/circle.md) — circle creation and querying
- [sketch/line.md](sketch/line.md) — line creation
- [sketch/arcByCenter.md](sketch/arcByCenter.md) — arc creation
- [sketch/geometry.md](sketch/geometry.md) — batch geometry creation
- [sketch/trimCurves.md](sketch/trimCurves.md) — trim workflow
- [sketch/splitAllCurves.md](sketch/splitAllCurves.md) — split at intersections
- [sketch/splitCurvesMergeBack.md](sketch/splitCurvesMergeBack.md) — apply trims
