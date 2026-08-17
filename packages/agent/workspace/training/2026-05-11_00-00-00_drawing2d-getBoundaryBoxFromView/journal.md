# Training: drawing2d.getBoundaryBoxFromView

**Date:** 2026-05-11

## Goal

Testing `v1.drawing2d.getBoundaryBoxFromView`.

**Methods to cover:**

- `getBoundaryBoxFromView` — params: id, types
- Return value: `Array<{ min: point, max: point }> | VOID`

**Questions:**

- What do the min/max points look like? Are they [x,y,z] with z=0?
- Does result order match input `types` array order?
- What happens when `types` is empty or omitted? (docs say: returns all existing views)
- What happens for a type that wasn't created? (e.g., ask for RIGHT when only TOP/FRONT exist)
- What happens with no views at all?
- How do bboxes relate to actual geometry dimensions (80×60×40 box)?
- Do bboxes change after `centerView`?
- Do bboxes change after `placeView`?
- Invalid type string handling
- Bbox for ISO view vs orthographic views — do they differ?

---

## 01 — basic happy path

Script: `scripts/01-basic.mjs` — ✅ Works as documented. Returns min/max bboxes for each view type.

**Data:** For an 80×60×40 box:
- TOP: min={x:0, y:0, z:0}, max={x:80, y:60, z:0} — matches length×width
- FRONT: min={x:0, y:0, z:0}, max={x:80, y:40, z:0} — matches length×height
- RIGHT: min≈{x:0, y:0, z:0}, max≈{x:60, y:40, z:0} — matches width×height (float noise ~5e-15)
- ISO: min={x:-42.43, y:0, z:0}, max={x:56.57, y:89.81, z:0} — isometric projection bbox

Points are `{ x, y, z }` objects (NOT arrays). z is always 0. Result order matches input `types` array order — confirmed by comparing all-four result to individual calls (see `files/01-basic-bbox-all-four.json` and `files/01-basic-bbox-individual.json`). maxLevel=31 on success.

**📌 LLM doc:** min/max are `{ x, y, z }` objects, not `[x,y,z]` arrays. Result order matches input order. Bbox widths correspond to 2D projected extents of the 3D geometry.

---

## 02 — empty types and omitted types

Script: `scripts/02-empty-types.mjs` — ⚠️ Doc discrepancy.

**Data:**
- Empty `types: []` → result: `[]` (empty array), maxLevel=31
- Omitted `types` entirely → result: `null` (VOID), maxLevel=51 (error)

**Learned:** Docs say "if empty, boundary boxes of all existing views will be returned" — but empty array returns empty array, not all views. Omitting `types` entirely causes an error (maxLevel=51). The `types` param appears required despite what the docs imply.

**📌 LLM doc:** Empty `types: []` returns `[]`, NOT all existing views (despite docs). Omitting `types` causes error. Always pass the types you want explicitly.

---

## 03 — non-existent view type

Script: `scripts/03-nonexistent-type.mjs` — ✅ Silently skips non-existent views.

**Data:** Only TOP and FRONT views created.
- `types: ['TOP', 'RIGHT']` → returns 1 bbox (TOP only), maxLevel=31, no messages
- `types: ['RIGHT', 'BACK']` → returns `[]` (empty array), maxLevel=31, no messages

**Learned:** Non-existent view types are silently skipped — no error, no warning. The result array only contains bboxes for types that actually exist. This is different from `placeView` (which returns error level 51 for missing types) and `centerView` (which silently no-ops). Consistent behavior: graceful skip.

**📌 LLM doc:** Non-existent types are silently skipped. Result only includes bboxes for views that exist.

---

## 04 — no views at all

Script: `scripts/04-no-views.mjs` — ✅ Error 1200 as expected.

**Data:**
- Specific type `['TOP']` with no views → null, maxLevel=51, error 1200: "There are no views exisiting on product"
- Empty types `[]` with no views → null, maxLevel=51

**Learned:** Same error 1200 as `centerView` and `placeView`. Views must be created first.

---

## 05 — invalid type string

Script: `scripts/05-invalid-type.mjs` — ✅ Error 1013.

**Data:**
- `types: ['BOGUS']` → null, maxLevel=51, error 1013 with valid type list
- `types: ['TOP', 'BOGUS']` → null, maxLevel=51, error 1013 — entire call fails

**Learned:** Any invalid type string causes the entire call to fail (error 1013). This is stricter than `placeView` where valid placements still execute despite errors on invalid ones. Here, one bad type poisons the whole request.

**📌 LLM doc:** Invalid type string fails the entire call (error 1013). Unlike placeView, valid types in the same call are NOT returned.

---

## 06 — after centerView

Script: `scripts/06-after-centerView.mjs` — ✅ Bbox reflects centering.

**Data:**
- BEFORE center: TOP [0,0,0]→[80,60,0], FRONT [0,0,0]→[80,40,0]
- AFTER center: TOP [-40,-30,0]→[40,30,0], FRONT [-40,-20,0]→[40,20,0]
- Width unchanged: 80 before → 80 after. Center moved to [0,0].

**Learned:** `getBoundaryBoxFromView` reflects the current view position. After centering, min/max shift symmetrically around origin but dimensions stay the same.

**📌 LLM doc:** Bbox reflects current view position including centering and placement. Use getBoundaryBoxFromView to verify centerView worked.

---

## 07 — after placeView

Script: `scripts/07-after-placeView.mjs` — ✅ Bbox reflects placement offset.

**Data:**
- Centered TOP: [-40,-30,0]→[40,30,0]
- After placing TOP by [0,100,0]: [-40,70,0]→[40,130,0] — Y shifted by exactly 100
- FRONT unchanged: [-40,-20,0]→[40,20,0]

**Learned:** Placement offsets are correctly reflected in the bbox. Only the placed view changes. This confirms `getBoundaryBoxFromView` tracks the live position state.

---

## 08 — all 9 view types

Script: `scripts/08-all-view-types.mjs` — ✅ All 9 types return valid bboxes.

**Data:** For 80×60×40 box (length×width×height):

| Type | Width × Height | Notes |
|---|---|---|
| TOP | 80.00 × 60.00 | XY → length×width |
| FRONT | 80.00 × 40.00 | XZ → length×height |
| RIGHT | 60.00 × 40.00 | YZ → width×height |
| LEFT | 60.00 × 40.00 | same as RIGHT |
| BOTTOM | 80.00 × 60.00 | same as TOP |
| RIGHT_90 | 40.00 × 60.00 | rotated RIGHT: height×width |
| LEFT_90 | 40.00 × 60.00 | same as RIGHT_90 |
| BACK | 80.00 × 40.00 | same as FRONT |
| ISO | 98.99 × 89.81 | isometric projection |

**Learned:** Opposite views (TOP/BOTTOM, FRONT/BACK, RIGHT/LEFT) have identical dimensions. RIGHT_90/LEFT_90 are the RIGHT/LEFT views rotated 90° (width and height swapped). ISO bbox is larger due to the diagonal projection.

---

## 09 — duplicate types in request

Script: `scripts/09-duplicate-types.mjs` — ✅ Duplicates return duplicate entries.

**Data:** `types: ['TOP', 'TOP', 'FRONT']` → returns 3 bboxes, maxLevel=31. The two TOP entries have identical values (see `files/09-duplicate-types-duplicate-types.json`).

**Learned:** Duplicate types are allowed and produce duplicate entries in the result. No deduplication.

---

## Coverage Checklist

- [x] API called successfully (script 01)
- [x] Required parameters tested: `id` and `types` (scripts 01–09)
- [x] Key optional behavior tested: empty types (02), omitted types (02)
- [x] Every view type exercised (script 08 — all 9 types)
- [x] Error cases: no views (04), invalid type (05), non-existent type (03)
- [x] Realistic usage: after centerView (06), after placeView (07)
- [x] Behavioral claims verified with data (filewrite dumps in every script)
- [x] Every question from Goal answered by a named script
- [x] Doc discrepancy found and documented (empty types behavior — script 02)
