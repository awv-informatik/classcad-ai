# Training: part.getSketchRegion

**Date:** 2026-04-09

## Goal

Testing `v1.part.getSketchRegion` — lookup a sketch region by name from a part (or instance), searching across all sketches in that part.

**Methods to cover:**

- `getSketchRegion` — basic lookup by name from part ID
- `getSketchRegion` — not-found case
- `getSketchRegion` — multiple sketches, region in second sketch
- `getSketchRegion` — case sensitivity
- `getSketchRegion` — default auto-generated names
- `getSketchRegion` — name collision (auto-suffixed names)
- `getSketchRegion` — invalid/wrong ID types
- `getSketchRegion` — compare with `sketch.getSketchRegion` results

**Questions:**

- Does it search all sketches in the part, or just the first?
- Is the return value identical to `sketch.getSketchRegion`?
- Does it accept instance IDs as documented?
- What errors differ from the sketch-level version?
- Does the name collision gotcha from `sketch.getSketchRegion` apply here too?

---

## 01 — basic lookup

Script: `scripts/01-basic-lookup.mjs` — ✅ works as expected. Created region "MyRegion", looked it up via part ID.

**Data:** `result: 92`, `maxLevel: 31`, `messages: []`. Returned ID matches creation ID. See `files/01-basic-lookup-basic-lookup.json`.

## 02 — not found

Script: `scripts/02-not-found.mjs` — ✅ returns null with error.

**Data:** `result: null`, `maxLevel: 51`, error code **0** (not 1015). Message: `"Couldn't find sketch region with name: \"DoesNotExist\""`. See `files/02-not-found-not-found.json`.

**📌 LLM doc:** Error code is 0, not 1015 like `sketch.getSketchRegion`. The API string in messages is `"v1.part.getSketchRegion"`. Error message omits the "which belongs to the provided sketch" suffix.

## 03 — multiple sketches

Script: `scripts/03-multiple-sketches.mjs` — ✅ searches across all sketches. Region in second sketch (id=132) found successfully from part.

**Data:** `result: 132`, `maxLevel: 31`, match: true. See `files/03-multiple-sketches-multiple-sketches.json`.

**📌 LLM doc:** Confirmed: searches all sketches in the part, not just the first.

## 04 — case sensitivity

Script: `scripts/04-case-sensitivity.mjs` — ✅ case-sensitive, same as sketch version.

**Data:** Exact "MyProfile" → found (92). "myprofile", "MYPROFILE", "myProfile" all → null, maxLevel 51. See `files/04-case-sensitivity-case-sensitivity.json`.

## 05 — default auto-generated names

Script: `scripts/05-default-names.mjs` — ✅ works with default names: "SketchRegion" (first), "SketchRegion0" (second).

**Data:** `SketchRegion` → 92, `SketchRegion0` → 126, `SketchRegion1` → null. See `files/05-default-names-default-names.json`.

## 06 — name collision

Script: `scripts/06-name-collision.mjs` — ✅ name collision gotcha applies. "Right" (work plane collision) stored as "Right0".

**Data:** Lookup "Right" → null/51. Lookup "Right0" → 92/31 (found). See `files/06-name-collision-name-collision.json`.

## 07 — invalid/wrong ID types

Script: `scripts/07-invalid-ids.mjs` — ✅ clear error messages.

**Data:**
- Sketch ID → code 1001: `"Provide only following id types: [\"part\",\"instance\"]"` — confirms it accepts part and instance IDs.
- Curve ID → code 1001: same message.
- Fake ID (99999) → codes 0+1006: `"ToId()/TOID() didn't get an existing or valid id."` + `"An element of parameter \"id\" has an invalid id!"`

See `files/07-invalid-ids-invalid-ids.json`.

**📌 LLM doc:** Accepted ID types: `["part", "instance"]`. Sketch IDs explicitly rejected.

## 08 — empty string name

Script: `scripts/08-empty-name.mjs` — ✅ treated as regular not-found.

**Data:** `result: null`, `maxLevel: 51`, code 0. See `files/08-empty-name-empty-name.json`.

## 09 — no regions in part (has sketch)

Script: `scripts/09-no-regions.mjs` — ✅ same not-found error.

**Data:** `result: null`, `maxLevel: 51`, code 0. See `files/09-no-regions-no-regions.json`.

## 10 — compare sketch vs part version

Script: `scripts/10-compare-sketch-vs-part.mjs` — ✅ both return the same region ID.

**Data:** `sketch.getSketchRegion` → 92/31. `part.getSketchRegion` → 92/31. Identical results, identical maxLevel. See `files/10-compare-sketch-vs-part-compare.json`.

## 11 — same name in different sketches (key finding)

Script: `scripts/11-same-name-diff-sketches.mjs` — ⚠️ when two sketches have regions with the same name, `part.getSketchRegion` returns the **first one** (region1=92), not the second (region2=134).

**Data:** `result: 92`, matched region1: true, matched region2: false. See `files/11-same-name-diff-sketches-same-name-diff-sketches.json`.

**📌 LLM doc:** Critical behavior — returns the first region found when names collide across sketches. The second region is unreachable via this API. Use `sketch.getSketchRegion` with the specific sketch ID to disambiguate.

## 12 — no sketches at all in part

Script: `scripts/12-no-sketch-in-part.mjs` — ✅ same not-found error, no special behavior.

**Data:** `result: null`, `maxLevel: 51`, code 0. See `files/12-no-sketch-in-part-no-sketch.json`.

---

## Summary of Answers

| Question | Answer |
|---|---|
| Searches all sketches? | **Yes** — finds regions across all sketches in the part |
| Return value identical to sketch version? | Yes — same region ID, same maxLevel (31 on success) |
| Accepts instance IDs? | Documented yes (`["part","instance"]`), not tested with actual instance |
| Error differences from sketch version? | Error code 0 (not 1015), message omits "which belongs to the provided sketch" |
| Name collision gotcha? | Yes — same auto-suffix behavior applies |
| Same-name regions in different sketches? | Returns first one found — second is unreachable via this API |
