# Training: part.getSketch

**Date:** 2026-04-08

## Goal

Testing `v1.part.getSketch` — retrieves sketch ID by name from a part.

**Methods to cover:**

- `getSketch` — basic lookup by name
- `getSketch` — non-existent name
- `getSketch` — duplicate names (first-match behavior per sketch.md LLM doc)
- `getSketch` — empty string name
- `getSketch` — wrong `id` type (sketch ID, EIF ID instead of part)
- `getSketch` — invalid/non-existent `id`
- `getSketch` — missing params (`id`, `name`)
- `getSketch` — after sketch deletion
- `getSketch` — case sensitivity of name lookup
- `getSketch` — sketch created via `sketch.create` vs `part.sketch`
- `getSketch` — part with no sketches

**Questions:**

- Does `getSketch` return VOID or null when no match? What's the maxLevel?
- Is name lookup case-sensitive?
- When there are duplicate names, does it always return the first-created one?
- Does it work with sketches on non-default work planes?

---

## 01 — basic lookup

Script: `scripts/01-basic-lookup.mjs` — ✅ as documented. Created sketch "MySketch" (id=52), getSketch returned 52. maxLevel=31, empty messages.

## 02 — not found

Script: `scripts/02-not-found.mjs` — returns `null` with maxLevel=51, error code 1015: "Sketch with name \"DoesNotExist\" does not exist".

**📌 LLM doc:** On miss: result=null, not VOID. Error code 1015 is the "not found" code.

## 03 — duplicate names

Script: `scripts/03-duplicate-names.mjs` — ✅ confirms first-match behavior. Created 3 sketches all named "Dup" (IDs 52, 58, 64). getSketch returned 52 — the first one created.

**📌 LLM doc:** With duplicate names, always returns the first-created sketch. Later duplicates are unreachable by name.

## 04 — empty name

Script: `scripts/04-empty-name.mjs` — ✅ works. Created sketch with `name: ""` (id=52), getSketch with `name: ""` found it. maxLevel=31.

## 05 — wrong id type

Script: `scripts/05-wrong-id-type.mjs` — all non-part IDs rejected.

| Input ID type | Error code | Message |
|---|---|---|
| sketch ID | 1001 | "wrong id type — provide only: ['part']" |
| entity injection ID | 1001 | "wrong id type — provide only: ['part']" |
| work plane ID | 1001 | "wrong id type — provide only: ['part']" |

All return null, maxLevel=51.

**📌 LLM doc:** `id` must be a part ID. Code 1001 for wrong type.

## 06 — invalid IDs and missing params

Script: `scripts/06-invalid-id.mjs` — comprehensive error catalogue:

| Input | Error code | Message |
|---|---|---|
| id=99999 (bogus) | 1006 | "invalid id" (plus WARNING 41 about TOID) |
| id=0 | 1006 | "invalid id" |
| id omitted | 1004 | "'id' must be provided" |
| name omitted | 1004 | "'name' must be provided" |
| both omitted | 1004 | "'id' must be provided" (id checked first) |

All return null, maxLevel=51.

**📌 LLM doc:** Both `id` and `name` are required. `id` is validated before `name`.

## 07 — case sensitivity

Script: `scripts/07-case-sensitivity.mjs` — **name lookup is case-sensitive.**

Created sketch "MySketch". Results:
- `"MySketch"` → found (52) ✅
- `"mysketch"` → null, error 1015
- `"MYSKETCH"` → null, error 1015
- `"mySketch"` → null, error 1015

**📌 LLM doc:** Case-sensitive lookup. Must match exactly.

## 08 — after deletion

Script: `scripts/08-after-deletion.mjs` — ✅ after deleting a sketch, getSketch returns null with error 1015. Clean behavior.

## 09 — sketch.create vs part.sketch

Script: `scripts/09-sketch-create-vs-part-sketch.mjs` — ✅ both creation methods produce sketches that getSketch can find. "ViaSketchCreate" → 52, "ViaPartSketch" → 58. Both matched.

## 10 — sketch on custom work plane

Script: `scripts/10-on-workplane.mjs` — ✅ sketch on a custom work plane (z=100) is findable by name. id=60, found=60.

## 11 — default name

Script: `scripts/11-default-name.mjs` — default name is "Sketch". Created two unnamed sketches (52, 58). `getSketch("Sketch")` returned 52. None of the standard naming guesses ("Sketch1", "Sketch_1", "Sketch 2", etc.) matched the second one.

## 12 — part with no sketches

Script: `scripts/12-part-with-no-sketches.mjs` — same error as not-found: null, maxLevel=51, code 1015.

## 13 — special characters in name

Script: `scripts/13-special-chars-name.mjs` — ✅ all special chars work for both creation and lookup:

| Name | Created | Found | Match |
|---|---|---|---|
| `Sketch/Front` | 52 | 52 | ✅ |
| `Sketch (Top)` | 58 | 58 | ✅ |
| `Sketch_v2.1` | 64 | 64 | ✅ |
| `Sketch-Left` | 70 | 70 | ✅ |
| `  Sketch  ` | 76 | 76 | ✅ |

Names with leading/trailing spaces, slashes, parentheses, dots — all matched exactly. No trimming.

**📌 LLM doc:** Name matching is literal — spaces, special chars preserved exactly.

## 14 — default name auto-numbering

Script: `scripts/14-default-name-duplicates.mjs` — **discovered default naming pattern.**

Created 3 unnamed sketches. Structure tree shows:
- id=52: name="Sketch"
- id=58: name="Sketch0"
- id=64: name="Sketch1"

All three findable by their auto-generated names. Pattern: first is "Sketch", then "Sketch0", "Sketch1", ...

**📌 LLM doc:** Auto-naming: "Sketch", "Sketch0", "Sketch1", etc. Note the inconsistency — first has no number suffix, second starts at 0.

## 15 — practical workflow

Script: `scripts/15-practical-workflow.mjs` — getSketch works for name-based retrieval in workflows. Also tested `getSketchRegion` with the sketch name — returned null (error 1015), meaning sketch regions have different names than their parent sketches. The region name is not automatically the same as the sketch name.

**📌 LLM doc:** `getSketchRegion` uses region names, not sketch names. Don't assume region name = sketch name.

---

## Coverage Checklist

- [x] API called successfully
- [x] Required params tested (id, name)
- [x] Not-found behavior (null, code 1015)
- [x] Duplicate names (first-match)
- [x] Empty name
- [x] Wrong id types (code 1001)
- [x] Invalid/non-existent ids (code 1006)
- [x] Missing params (code 1004)
- [x] After deletion
- [x] Case sensitivity (exact match required)
- [x] Both creation methods (sketch.create, part.sketch)
- [x] Sketch on custom work plane
- [x] Part with no sketches
- [x] Special characters in name
- [x] Default auto-naming pattern
- [x] Practical workflow (name-based retrieval + extrusion attempt)
- [x] Relationship with getSketchRegion
- [x] All findings backed by data (filewrite dumps, log values)
