# Training: drawing2d.placeView

**Date:** 2026-05-11

## Goal

Testing `v1.drawing2d.placeView` — places views relatively to their current position in XY-plane.

**Methods to cover:**

- `placeView` — basic placement with single offset
- `placeView` — multiple placements in one call
- `placeView` — cumulative behavior (repeated calls)
- `placeView` — interaction with `centerView` (reset)
- `placeView` — verification via `getBoundaryBoxFromView`

**Questions:**

- Does offset accumulate across repeated `placeView` calls? (docs say "relatively to current position")
- What happens when placing a view type that doesn't exist?
- What happens with invalid type strings?
- Does the Z component of offset matter (views are in XY-plane)?
- Empty placements array — error or no-op?
- Zero offset — silent no-op or actual processing?
- Can the same type appear multiple times in one placements array?

---

## 01 — basic placement

Script: `scripts/01-basic-placement.mjs` — ✅ basic placement with multiple views works as documented.

**Data:** Created TOP/FRONT/RIGHT views on an 80×60×40 box. Applied offsets: TOP=[0,100,0], FRONT=[0,0,0], RIGHT=[150,0,0]. Result: null (VOID), maxLevel=31.

Bbox verification via `getBoundaryBoxFromView`:
- TOP: [0,0]–[80,60] → [0,100]–[80,160] (Y+100) ✓
- FRONT: [0,0]–[80,40] → unchanged (zero offset) ✓
- RIGHT: [~0,~0]–[~60,~40] → [150,~0]–[210,~40] (X+150) ✓

See `files/01-basic-placement-placement-data.json`.

📌 LLM doc: Basic behavior confirmed — offsets are relative translations, result is VOID, maxLevel=31 on success.

## 02 — cumulative offsets

Script: `scripts/02-cumulative-offsets.mjs` — ✅ offsets accumulate across repeated calls.

**Data:** Applied [50,0,0] to TOP twice, then [0,30,0]:
- Initial: [0,0]–[80,60]
- After 1st [50,0,0]: [50,0]–[130,60] (X+50)
- After 2nd [50,0,0]: [100,0]–[180,60] (X+100 total)
- After [0,30,0]: [100,30]–[180,90] (X+100, Y+30 total)

Confirmed: offsets are truly relative/cumulative. Each call adds to the current position.

See `files/02-cumulative-offsets-cumulative-data.json`.

📌 LLM doc: Offsets accumulate — "relatively to its current position" means each call adds to the current position, not to the original position.

## 03 — nonexistent type

Script: `scripts/03-nonexistent-type.mjs` — ⚠️ error for missing view but valid placements still execute.

**Data:** Created TOP/FRONT views only, then placed RIGHT (nonexistent) and TOP (valid) in one call.
- maxLevel=51 (ERROR), code=0, message: "View of type: 3 = SR, does not exist in ViewSet!"
- TOP was still placed: bbox moved from [0,0]–[80,60] to [0,50]–[80,110] (Y+50) ✓

The error for nonexistent RIGHT does NOT block the valid TOP placement. Mixed results in one call.

See `files/03-nonexistent-type-nonexistent-data.json`.

📌 LLM doc: Nonexistent type produces error level 51 code 0, but does NOT block other valid placements in the same call.

## 04 — invalid type string

Script: `scripts/04-invalid-type.mjs` — ✅ error 1013 as expected.

**Data:** Placed with type='INVALID'. Error code 1013, level 51: "The provided value for parameter \"type\" is not valid. Possible values are: [\"TOP\",\"FRONT\",\"RIGHT\",\"LEFT\",\"BOTTOM\",\"RIGHT_90\",\"LEFT_90\",\"BACK\",\"ISO\"]"

Same error as view() and centerView() for invalid type strings.

See `files/04-invalid-type-invalid-type-data.json`.

## 05 — edge cases

Script: `scripts/05-edge-cases.mjs` — ⚠️ Z component unexpectedly applied.

**Data:**

1. **Empty placements []**: silent no-op, maxLevel=31, no messages.
2. **Z offset [0,0,999]**: Z IS applied — bbox moved from Z=0 to Z=999. Unexpected since docs say "in xy-plane". Not useful in practice but not blocked.
3. **Duplicate type in one call**: both offsets applied cumulatively. FRONT with [10,0,0] then [20,0,0] → final shift X+30 ([30,0]–[110,40]).
4. **No views (via part.create clearing drawing)**: error 1001, "id = VOID" — stale ID from first part.create being passed.

See `files/05-edge-cases-edge-cases-data.json`.

📌 LLM doc: Z offset is technically accepted and applied but pointless for 2D drawing layout. Duplicate types in one call stack cumulatively. Empty placements = no-op.

## 06 — no views (clean)

Script: `scripts/06-no-views-clean.mjs` — ✅ error 1200 as expected.

**Data:** Single part with box, no views created. Error code 1200, level 51: "There are no views exisiting on product with id: $4. You have to create the views first, before trying to place views."

Same error code as centerView (1200). Confirms views must exist before placement.

See `files/06-no-views-clean-no-views-clean-data.json`.

## 07 — center-then-place workflow

Script: `scripts/07-center-then-place.mjs` — ✅ recommended workflow confirmed.

**Data:** view() → centerView() → placeView() → centerView() (again). Full workflow on 80×60×40 box with TOP/FRONT/RIGHT/ISO.

Bbox progression:
- Raw (after view): views at default positions starting at origin
- Centered: all views centered — TOP: [-40,-30]–[40,30], FRONT: [-40,-20]–[40,20], etc.
- Placed (TOP Y+80, FRONT 0, RIGHT X+120, ISO X+250 Y+80): offsets applied from centered positions ✓
- Re-centered: all back to origin-centered — identical to post-centerView bbox ✓

Confirms: centerView undoes placeView offsets. The recommended workflow `view() → centerView() → placeView() → export` is correct.

See `files/07-center-then-place-center-place-workflow.json`.

📌 LLM doc: Document the full workflow and that centerView resets placeView offsets.
