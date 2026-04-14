# Sketching Guide — Reproducing Technical Drawings in ClassCAD

A practical guide for parsing 2D technical drawings and recreating them as ClassCAD sketches. Covers the full pipeline from dimension analysis through construction, trimming, constraints, and iterative evaluation.

## The Method

**Don't try to draw the final profile directly.** The visible outline of a mechanical part is the result of trimming and intersecting simpler shapes. Reconstruct those original shapes first, then trim.

```
1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Dimensions → 5. Trim → 6. Constrain → 7. Evaluate
```

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

Don't draw arcs or try to compute tangent points upfront. Place every circle and line at its full extent:

```js
const noGen = { genFixation: false, genIncidence: false,
                genVertAndHoriz: false, genTangency: false }
await api.v1.sketch.circle({
  id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen
})
```

Always disable auto-constraint generation (`gen*` flags) — auto-constraints interfere with precise programmatic placement.

This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix center positions before proceeding.

---

## Step 4 — Add Dimensions

Add ClassCAD dimensions to the placed geometry. This serves two purposes:
1. **Position verification** — auto-calculated values should match the source drawing. If a dimension reads 47.8 instead of 48, the geometry is off.
2. **Readability** — dimensions appear in snapshots, making comparison easier.

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
- The `value` parameter at creation time is **broken** — always create first, then call `updateDimension` to set values.
- `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.

---

## Step 5 — Trim

Once shapes are positioned and verified, trim them to reveal the final profile.

### The three-step trim workflow

```js
// 1. Split all curves at their intersection points (staged — nothing visible changes)
const segments = (await api.v1.sketch.splitAllCurves({ id: skId })).result

// 2. Mark unwanted segments for removal (still staged)
await api.v1.sketch.trimCurves({ id: skId, curveIds: segmentsToRemove })

// 3. Apply the trims (geometry changes now)
await api.v1.sketch.splitCurvesMergeBack({ id: skId })
```

### Classifying segments

With many overlapping shapes, `splitAllCurves` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.

**Approach**: for each segment, compute its arc midpoint and test whether it falls inside another contour shape. If it does, it's an interior segment — trim it.

Assign roles to your shapes before trimming:
- **Contour shapes** (profile boundary): trim segments that fall inside other contour shapes
- **Hole shapes** (through-holes, bores): keep all segments — they're entirely inside the body
- **Slot shapes** (internal cutouts): keep segments inside the body contour, trim the rest

### Trim rules

- `trimCurves` only accepts IDs returned by `splitAllCurves` — not original geometry IDs
- `trimCurves` is **atomic** — one invalid ID fails the entire call, no partial trims
- After `mergeBack`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
- `splitAllCurves → mergeBack` without trimming is a safe no-op (round-trip restore)

---

## Step 6 — Add Constraints

Constraints declare geometric relationships between sketch elements. In ClassCAD, they are metadata only — they don't reposition geometry.

```js
await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [circle1, circle2] })
await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [lineId, circleId] })
await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
```

### Constraint behavior

- **Constraints never move geometry.** They store rules in the structure tree. The solver does not run.
- No conflict or redundancy detection — contradictory or duplicate constraints are silently accepted.
- SYMMETRY requires the axis line as the FIRST element: `geomIds: [axisLine, geom1, geom2]`
- Auto-generated constraints (from `gen*` flags) are named `Auto_*`.

---

## Step 7 — Evaluate and Iterate

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
| Split at intersections | `sketch.splitAllCurves` | Staged — needs mergeBack |
| Mark for removal | `sketch.trimCurves` | Only splitAllCurves IDs |
| Apply trims | `sketch.splitCurvesMergeBack` | Commits staged state |

### Common pitfalls
- **Z must be 0** for all 2D sketch coordinates — non-zero Z is a hard error (code 1014)
- **Disable `gen*` flags** when placing geometry programmatically
- **`getPositions` fails on circle IDs** — use `getPoints` → `centerId` → `getPositions`
- **`dimension` `value` param is broken** — create first, then `updateDimension`
- **`splitAllCurves` ≠ `splitCurves`** — completely different operations with incompatible results

---

## Related

- [sketch/constraint.md](sketch/constraint.md) — geometric constraints
- [sketch/dimension.md](sketch/dimension.md) — dimensional constraints
- [sketch/circle.md](sketch/circle.md) — circle creation and querying
- [sketch/line.md](sketch/line.md) — line creation
- [sketch/arcByCenter.md](sketch/arcByCenter.md) — arc creation
- [sketch/geometry.md](sketch/geometry.md) — batch geometry creation
- [sketch/trimCurves.md](sketch/trimCurves.md) — trim workflow
- [sketch/splitAllCurves.md](sketch/splitAllCurves.md) — split at intersections
- [sketch/splitCurvesMergeBack.md](sketch/splitCurvesMergeBack.md) — apply trims
