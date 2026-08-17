# Training: sketch.getSketchRegion

**Date:** 2026-04-09

## Goal

Testing `v1.sketch.getSketchRegion` — lookup a sketch region by name within a sketch.

**Methods to cover:**

- `getSketchRegion` — basic lookup by name
- `getSketchRegion` — lookup with default-named regions (auto-generated names)
- `getSketchRegion` — lookup nonexistent name (error path)
- `getSketchRegion` — multiple regions, lookup each by name
- `getSketchRegion` — case sensitivity of name param
- `getSketchRegion` — empty string name
- `getSketchRegion` — with invalid sketch ID
- `getSketchRegion` — name collision with existing objects

**Questions:**

- What does `result` contain when found vs not found?
- What are the exact error messages/codes for not-found?
- Does the name match exactly or is it case-insensitive?
- Can you look up regions with default auto-generated names?
- What happens with empty string name?
- What happens when sketch has no regions?
- What happens when `sketchRegion` name collides with existing object names?

---

## 01 — basic lookup

Script: `scripts/01-basic-lookup.mjs` — ✅ works as expected. Created region named "MyRegion", looked it up successfully.

**Data:** `result: 92`, `maxLevel: 31`, `messages: []`. Returned ID matches the creation ID exactly. See `files/01-basic-lookup-lookup-result.json`.

## 02 — not found

Script: `scripts/02-not-found.mjs` — ✅ as expected. Lookup of nonexistent name returns `null`.

**Data:** `result: null`, `maxLevel: 51`, error code 1015. Message: `"Couldn't find sketch region with name: \"DoesNotExist\" which belongs to the provided sketch."` See `files/02-not-found-not-found.json`.

## 03 — default auto-generated names

Script: `scripts/03-default-names.mjs` — ✅ confirmed default naming scheme. First region is "SketchRegion", second is "SketchRegion0".

**Data:** `SketchRegion` → region 124 (match), `SketchRegion0` → region 126 (match), `SketchRegion1` → null/51 (correct — doesn't exist). See `files/03-default-names-default-names.json`.

## 04 — case sensitivity

Script: `scripts/04-case-sensitivity.mjs` — ✅ name matching is **case-sensitive**. Only exact match works.

**Data:** `"MyProfile"` → found (id 92). `"myprofile"`, `"MYPROFILE"`, `"myProfile"` all → null, maxLevel 51. See `files/04-case-sensitivity-case-sensitivity.json`.

**📌 LLM doc:** Name lookup is case-sensitive — document this.

## 05 — empty string name

Script: `scripts/05-empty-name.mjs` — ✅ empty string is treated as a regular not-found. No special error.

**Data:** `result: null`, `maxLevel: 51`, code 1015, same error message pattern with empty name embedded. See `files/05-empty-name-empty-name.json`.

## 06 — no regions in sketch

Script: `scripts/06-no-regions.mjs` — ✅ same not-found error (code 1015) even when sketch has zero regions.

**Data:** `result: null`, `maxLevel: 51`, code 1015. No different behavior from looking up a wrong name in a sketch that has regions. See `files/06-no-regions-no-regions.json`.

## 07 — invalid sketch ID

Script: `scripts/07-invalid-sketch-id.mjs` — ✅ clear error messages for wrong ID types.

**Data:**
- Part ID instead of sketch: `result: null`, code 1001 — `"The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]"`
- Fake ID (99999): `result: null`, codes 0+1006 — `"ToId()/TOID() didn't get an existing or valid id."` + `"An element of parameter \"id\" has an invalid id!"`
- Curve ID: `result: null`, code 1001 — same "wrong id type" message

See `files/07-invalid-sketch-id-invalid-ids.json`.

**📌 LLM doc:** `id` must be a sketch ID. Part IDs, curve IDs, and invalid IDs all fail with clear error messages.

## 08 — multiple regions

Script: `scripts/08-multiple-regions.mjs` — ⚠️ partially unexpected. "Left" and "Center" looked up fine, but "Right" returned null.

**Data:** Created regions Left=156, Center=158, Right=160. Lookup: Left ✓, Center ✓, Right ✗ (null). See `files/08-multiple-regions-multiple-regions.json`.

This led to the investigation in scripts 09-11.

## 09 — debug: structure tree names

Script: `scripts/09-three-regions-debug.mjs` — Dumped structure to find actual stored names.

**Data:** Structure tree shows region 160 stored as `name="Right0"`, not "Right". Regions 156 and 158 stored as "Left" and "Center" respectively.

## 10 — dump full structure

Script: `scripts/10-dump-structure.mjs` — Confirmed via structure dump: a `CC_WorkPlane` named "Right" (id=46) already exists as a default work plane. `setObjectName` rename attempt was a no-op (VOID result, maxLevel 31).

**Data:** See `files/10-dump-structure-structure.json` (75KB). Three `CC_SketchRegion` nodes found: id=156 name="Left", id=158 name="Center", id=160 name="Right0".

## 11 — name collision investigation (key finding)

Script: `scripts/11-name-collision.mjs` — ✅ confirmed: `sketchRegion` auto-suffixes names that collide with existing objects in the drawing.

**Data:**
- `name: 'Right'` → stored as "Right0" (collides with CC_WorkPlane "Right"). Lookup by "Right" fails, by "Right0" succeeds.
- `name: 'Top'` → stored as "Top0" (collides with CC_WorkPlane "Top"). Same pattern.
- `name: 'UniqueProfile'` → stored as-is. Lookup succeeds.

See `files/11-name-collision-name-collision.json`.

**📌 LLM doc:** Critical gotcha — `sketchRegion` silently renames regions that collide with existing object names (like default work planes: Top, Front, Right). The name you pass is NOT necessarily the name stored. Always verify with `getSketchRegion` or check the structure tree. Default work planes in every part: Top, Front, Right (and their Ref variants).

## 12 — success envelope shape

Script: `scripts/12-success-maxlevel.mjs` — ✅ confirmed: successful lookup returns `maxLevel: 31`, empty messages array, result is a `number` type.

**Data:** `result: 92`, `maxLevel: 31`, `messages: []`, `resultType: "number"`. See `files/12-success-maxlevel-success-envelope.json`.

---

## Summary of Answers

| Question | Answer |
|---|---|
| Result when found? | Region ID (number), maxLevel=31, messages=[] |
| Result when not found? | `null`, maxLevel=51, code 1015, descriptive error message |
| Case sensitive? | **Yes** — exact match only |
| Default names? | Works: "SketchRegion" (first), "SketchRegion0" (second), etc. |
| Empty string name? | Same not-found error (code 1015) |
| No regions in sketch? | Same not-found error — no special behavior |
| Name collision? | `sketchRegion` silently auto-suffixes (e.g. "Right" → "Right0"). Must look up by actual stored name. |
