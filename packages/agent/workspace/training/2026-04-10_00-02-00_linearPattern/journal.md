# Training: sketch.linearPattern

**Date:** 2026-04-10

## Goal

Testing `v1.sketch.linearPattern` — patterns a rigid set in a linear/rectangular arrangement.

**Methods to cover:**

- `linearPattern` — basic X-axis pattern (xCount + xDistance)
- `linearPattern` — basic Y-axis pattern (yCount + yDistance)
- `linearPattern` — 2D grid pattern (both X and Y)
- `linearPattern` — edge cases: count=1, distance=0, negative distance
- `linearPattern` — return value structure: constraint, dimensions, geometry

**Questions:**

- What does the return value look like? (constraint ID, dimensions array, geometry array)
- Can you pass a single geometry ID instead of a rigidSetId? (docs say "rigidset or single object")
- What happens with xCount=1, yCount=1 (no actual copies)?
- What happens with negative distances?
- What happens with distance=0?
- Are the returned geometry IDs the copies or include the original?
- What's in the dimensions array? Are they VOID when that axis isn't used?

---

## 01 — basic X-axis pattern

Script: `scripts/01-basic-x-pattern.mjs` — ✅ 3 copies along X with 30mm spacing.

| ![x-pattern](files/01-basic-x-pattern-x-pattern-3-copies.png) |
|---|

**Data:** maxLevel=31. Return: `{ constraint: 92, dimensions: [94, null], geometry: [74, 82, 90] }`. Geometry array has 3 items = xCount. First item (74) is the original rigid set ID. `dimensions[0]` = xDistance dimension ID, `dimensions[1]` = null (no Y axis used).

**📌 LLM doc:** geometry count = xCount (includes original). dimensions array is [xDimId | null, yDimId | null].

## 02 — Y-axis pattern

Script: `scripts/02-y-pattern.mjs` — ✅ 4 copies of a rectangle along Y with 20mm spacing.

| ![y-pattern](files/02-y-pattern-y-pattern-4-copies.png) |
|---|

**Data:** maxLevel=31. dimensions=[null, 138]. geometry count=4 = yCount. Confirms: `dimensions[0]` = null when X unused, `dimensions[1]` = yDim ID.

## 03 — 2D grid pattern

Script: `scripts/03-2d-grid.mjs` — ✅ 3×2 grid of circles.

| ![grid](files/03-2d-grid-grid-3x2.png) |
|---|

**Data:** maxLevel=31. dimensions=[87, 89] (both filled). geometry count=6 = 3×2. Total items in geometry array = xCount × yCount.

**📌 LLM doc:** geometry count = xCount × yCount. Both dimension IDs populated for 2D grids.

## 04 — edge cases (multi-part script)

Script: `scripts/04-edge-cases.mjs` — mixed results. Multi-`part.create` within a single script causes ID invalidation for subsequent tests. Tests 04c and 04d gave misleading `"id = VOID"` errors due to this.

**Learned:** Negative xDistance works (maxLevel 31, copies go in -X). Zero distance and count=1 results from this script are unreliable due to multi-part interference.

**📌 LLM doc:** Negative distance is valid — copies go in the negative direction.

## 05 — single geometry ID (no rigid set)

Script: `scripts/05-single-geom-id.mjs` — ✅ Passing a circle ID directly as `rigidSetId` works.

**Data:** circle=58, geometry=[63, 67, 71]. The API auto-wraps the single geometry into a rigid set internally — first geometry ID (63) differs from the original circle ID (58). maxLevel=31.

**📌 LLM doc:** rigidSetId accepts both rigid set IDs and single geometry IDs. The API auto-wraps singles.

## 06 — zero distance detail (multi-part — partially unreliable)

Script: `scripts/06-zero-dist-detail.mjs` — 06a succeeded (zero xDistance), 06b and 06c failed with `"id = VOID"` due to multi-part.create interference.

## 07 — zero yDistance (isolated)

Script: `scripts/07-zero-ydist-isolated.mjs` — ✅ Zero yDistance with yCount=3 works in isolation.

**Data:** maxLevel=31. geometry=[64, 69, 74] (3 items). All copies stack at the same Y position.

**📌 LLM doc:** Zero distance is allowed — copies stack at identical positions. Not an error.

## 08 — large count and negative xDistance

Script: `scripts/08-large-count.mjs` — ✅ 5×3 grid with negative xDistance.

| ![large](files/08-large-count-5x3-neg-xdist.png) |
|---|

**Data:** geometry count=15 = 5×3. Both dimensions populated. Negative direction confirmed visually.

## 09 — dimension update

Script: `scripts/09-dimension-update.mjs` — ✅ Both dimension IDs from linearPattern are updatable via `sketch.updateDimension`.

| ![before](files/09-dimension-update-before-update.png) | ![after-x](files/09-dimension-update-after-xdist-40.png) | ![after-y](files/09-dimension-update-after-ydist-15.png) |
|---|---|---|

**Data:** updateDimension on xDimId: maxLevel=31. updateDimension on yDimId: maxLevel=31. Pattern spacing updated.

**📌 LLM doc:** Dimension IDs from the return value can be updated with `sketch.updateDimension` to change spacing after creation.

## 10 — count edge cases (zero, fractional, negative)

Script: `scripts/10-count-zero-fractional.mjs` — all succeed (maxLevel 31).

**Data:**
- count=0: geometry=[64] (original only), dimensions=[null, null]. Constraint created but no copies.
- count=2.5: geometry count=2. Fractional count is truncated (floor). 2 total = original + 1 copy.
- count=-2: geometry=[64] (original only). Same as count=0 — negative count = no copies.

**📌 LLM doc:** count=0 and negative counts are valid (no copies made). Fractional counts are floored. count includes the original — xCount=3 means 3 total (original + 2 copies).

## 11 — delete pattern

Script: `scripts/11-delete-pattern.mjs` — ✅ Deleting the constraint preserves copied geometry.

| ![before](files/11-delete-pattern-before-delete.png) | ![after](files/11-delete-pattern-after-delete-constraint.png) |
|---|---|

**Data:** After deleting constraint ID, `getGeometry` returns 3 lines [58, 65, 70] — original + copies survive. The constraint node and dimension node are removed, but geometry remains.

**📌 LLM doc:** Deleting the pattern constraint (via `sketch.deleteObject`) removes the constraint/dimension nodes but preserves all copied geometry. Copies become independent.

---

## Coverage Checklist

- [x] API called successfully
- [x] Required params tested (id, rigidSetId)
- [x] Optional params exercised (xCount, xDistance, yCount, yDistance — all four)
- [x] No enum variants for this API
- [x] No dedicated update/delete — but dimensions updatable via updateDimension, constraint deletable via deleteObject
- [x] Realistic usage: rigid set from multiple lines, grid pattern, single geometry pass-through
- [x] Behavioral claims verified with filewrite data
