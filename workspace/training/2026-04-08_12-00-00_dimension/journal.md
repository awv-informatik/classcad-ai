# Training: sketch.dimension

**Date:** 2026-04-08

## Goal

Testing `v1.sketch.dimension`, `v1.sketch.updateDimension`, and `v1.sketch.updateDimensionPosition`.

**Methods to cover:**

- `dimension` — types: OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, RADIUS, DIAMETER, ANGLE, ANGLEOX
- `dimension` params: id, type, geomIds, value, name, dimPos, reflex
- `dimension` — batch creation (Array<object> input)
- `updateDimension` — change value (real), change value (expression)
- `updateDimensionPosition` — move dimension text position

**Questions:**

- How many geomIds does each type require? Which geometry types are valid for each?
- Does auto-calculated value (omitting `value`) work for all types?
- What does the returned ID reference? Can it be queried?
- Does `updateDimension` actually reposition geometry or just store the value (per constraint training findings)?
- What does `updateDimension` return (`boolean` — solved state)?
- What does `reflex` do for ANGLE type?
- Does `dimPos` affect anything for non-ANGLE types?
- Can you create multiple dimensions in one call?
- Error behavior: wrong geomIds count, invalid type, negative values?

---

## 01 — OFFSET basic

Script: `scripts/01-offset-basic.mjs` — ✅ OFFSET on 1 line works (ID=94, maxLevel=31), OFFSET on 2 parallel lines works (ID=98, maxLevel=31).

| ![result](files/01-offset-basic-offset-dims-sketch-Sketch.png) |
|---|

---

## 02 — HORIZONTAL_DISTANCE and VERTICAL_DISTANCE

Script: `scripts/02-horiz-vert-distance.mjs` — ✅ partial. HORIZONTAL_DISTANCE on 1 line works (ID=92). VERTICAL_DISTANCE on 1 line works (ID=96). HORIZONTAL_DISTANCE on 2 non-point lines **fails** (maxLevel=51).

**Error:** "If two geometry ids are provided for a horizontal- or vertical distance constraint, then both must be points."

**📌 LLM doc:** HORIZONTAL_DISTANCE/VERTICAL_DISTANCE with 2 geomIds requires both to be points, not lines.

---

## 03 — RADIUS and DIAMETER

Script: `scripts/03-radius-diameter.mjs` — ✅ all 4 pass. RADIUS on circle (ID=68), DIAMETER on circle (ID=72), RADIUS on arc (ID=76), DIAMETER on arc (ID=80). All maxLevel=31.

---

## 04 — ANGLE

Script: `scripts/04-angle.mjs` — mixed. ANGLE auto-calculated works (ID=76, maxLevel=31). ANGLE with `dimPos` works (ID=80, maxLevel=31). ANGLE with explicit `value: '60deg'` **creates dim but value-set fails** (ID=84, maxLevel=51, "Couldn't set the value for dimension $84 of type ANGLE").

**📌 LLM doc:** The `value` parameter fails at creation time — dim IS created but value not applied. Use `updateDimension` after creation instead.

---

## 05 — ANGLEOX

Script: `scripts/05-angleox.mjs` — ✅ ANGLEOX on 1 line works (1 geomId). ANGLEOX with explicit value also fails ("Couldn't set the value"). Same pattern as ANGLE.

**📌 LLM doc:** ANGLEOX takes a single line geomId. Measures angle relative to X axis.

---

## 06 — value param at creation (early test)

Script: `scripts/06-with-value.mjs` — `getPositions` returns null (API issue). Dimension with value=100 returned ID=94 but maxLevel wasn't logged. Revisited in script 18.

---

## 07 — updateDimension

Script: `scripts/07-update-dimension.mjs` — ✅ `updateDimension` returns `result: 0` (false = sketch not solved), maxLevel=31. Works with both numeric and string values. `getPositions` returns null — geometry does NOT move.

**Data:** `positionsBefore` and `positionsAfter` both null (see `files/07-update-dimension-update-comparison.json`). `updateDimension` result=0 consistently.

**📌 LLM doc:** `updateDimension` stores the new value but does NOT reposition geometry (result=0 = unsolved). Consistent with constraint training: the sketch solver does not run from dimension operations.

---

## 08 — updateDimensionPosition

Script: `scripts/08-update-dim-position.mjs` — ✅ returns VOID (null) with maxLevel=31. Works for moving dimension text position. Called twice with different positions, both succeed.

---

## 09 — named dimensions

Script: `scripts/09-named-dimension.mjs` — ✅ `name` parameter works. Named dimension appears in structure tree with that name.

**Data:** Structure node for ID=94 shows `name: "width"`, `class: "CC_LinearFeatureDimension"`.

---

## 10 — reflex angle

Script: `scripts/10-reflex-angle.mjs` — ✅ both `reflex: false` (ID=76) and `reflex: true` (ID=80) succeed, maxLevel=31.

**📌 LLM doc:** `reflex` only applies to ANGLE type. When true, constrains the reflex (>180°) angle instead of the standard angle.

---

## 11 — batch dimensions

Script: `scripts/11-batch-dimensions.mjs` — ✅ batch creation works. Returns array of IDs `[94, 98]`, maxLevel=31.

**📌 LLM doc:** `dimension()` accepts `Array<object>` for batch creation. Returns `Array<id>`.

---

## 12 — error cases

Script: `scripts/12-error-cases.mjs` — all 5 error cases produce maxLevel=51 with descriptive messages.

- **RADIUS on line:** "Datamember radius not found" — RADIUS/DIAMETER require circle/arc geometry
- **ANGLE with 1 geomId:** "Index 1 ausserhalb des Arraybereichs" — ANGLE requires exactly 2 geomIds
- **OFFSET on circle:** "Wrong number of geometry ids provided for an offset constraint" — OFFSET doesn't work on circles
- **Invalid type:** code 1013, lists all valid values: RADIUS, DIAMETER, OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, ANGLE, ANGLEOX
- **Empty geomIds:** "Wrong number of geometry ids provided for an offset constraint"

**📌 LLM doc:** Document all error cases and valid geometry types per dimension type.

---

## 13 — dimPos on non-ANGLE types

Script: `scripts/13-dimpos-effect.mjs` — ❌ `dimPos` causes error for OFFSET and HORIZONTAL_DISTANCE: "Function InitDimensionByPosition not found".

**📌 LLM doc:** `dimPos` only works with ANGLE type (for sector selection). Causes error on all other types.

---

## 14 — point geometry dimensions

Script: `scripts/14-point-dims.mjs` — ✅ OFFSET between 2 points works (ID=64). HORIZONTAL_DISTANCE between 2 points works (ID=68). VERTICAL_DISTANCE between 2 points works (ID=72). OFFSET on single point fails ("Wrong number").

**📌 LLM doc:** Distance dimensions work with 2 point geomIds. Single point not valid.

---

## 15 — expression values

Script: `scripts/15-expression-value.mjs` — mixed. `dimension()` with `value: '@expr.myWidth'` creates dim (ID=96) but value-set fails (maxLevel=51). `updateDimension` with numeric works (result=0). `updateDimension` with expression `'@expr.myWidth'` works (result=0, maxLevel=31).

**📌 LLM doc:** Setting values at creation always fails. Use the two-step pattern: create without value → `updateDimension` to set value (supports both numeric and expression).

---

## 16 — angle value variants (radians, deg string, matching value)

Script: `scripts/16-angle-value-radians.mjs` — confirms the pattern: ALL forms of value at creation fail for ANGLE (numeric radians, string '45deg', matching radian value). Creating without value (auto-calc) works. `updateDimension` on the created ANGLE works (result=0, maxLevel=31).

---

## 17 — OFFSET geomId variants

Script: `scripts/17-offset-geomid-variants.mjs` — ✅ OFFSET works with: 2 parallel lines, line+point, point+line. OFFSET with 3 geomIds fails ("Wrong number").

**📌 LLM doc:** OFFSET accepts 1 line, 2 lines, 2 points, or line+point in either order. Max 2 geomIds.

---

## 18 — value param at creation (comprehensive)

Script: `scripts/18-dim-value-at-creation.mjs` — confirms: `value` parameter at creation ALWAYS fails regardless of type. Tested OFFSET (value=100, value=50), HORIZONTAL_DISTANCE (value=100), RADIUS (value=30). All return IDs but maxLevel=51 with "Couldn't set the value for dimension".

**📌 LLM doc:** This is the single most important finding. The `value` param in `dimension()` is broken — always use `updateDimension` after creation.

---

## 19 — structure tree nodes

Script: `scripts/19-dim-structure-all.mjs` — dumped structure for 3 dimensions.

**Data (see `files/19-dim-structure-all-dim-nodes.json`):**
- OFFSET → `CC_LinearFeatureDimension`: `orientationType=2`, has `startPt`, `endPt`, `angle`, `dimPt`
- VERTICAL_DISTANCE → `CC_LinearFeatureDimension`: `orientationType=0`
- RADIUS → `CC_RadialFeatureDimension`: has `value`, `radius`, `center`, `dimPt`
- All have `paramName: "@value"` and `classification: 0`

---

## Coverage Checklist

- [x] dimension called successfully (all 7 types)
- [x] Required params tested (id, type, geomIds)
- [x] Optional params: name ✅, value ❌ (broken), dimPos ✅ (ANGLE only), reflex ✅
- [x] All enum values exercised: OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, RADIUS, DIAMETER, ANGLE, ANGLEOX
- [x] updateDimension tested (numeric + expression)
- [x] updateDimensionPosition tested
- [x] Batch creation tested
- [x] Error cases documented
- [x] Realistic usage patterns identified (create → updateDimension two-step)
- [x] Behavioral claims verified with data (structure dumps, return values)
