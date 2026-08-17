# Training: part.updateWorkPoint

**Date:** 2026-03-30

## Goal

Testing `v1.part.updateWorkPoint` — modifying work point features after creation.

**Methods to cover:**

- `updateWorkPoint` — update position for USERDEFINED
- `updateWorkPoint` — change name
- `updateWorkPoint` — change type (e.g., USERDEFINED → BREPVERTEX)
- `updateWorkPoint` — change references for referenced types
- `updateWorkPoint` — update without openFeature vs with openFeature
- `updateWorkPoint` — error cases (invalid ID, wrong type for refs)

**Questions:**

- Does updateWorkPoint require openFeature/closeFeature like updateWorkAxis/updateWorkCSys?
- What happens if you update only name but not position or type?
- Can you change type from USERDEFINED to a referenced type?
- What does the return value look like after update?
- Does updating position on a referenced type silently fail or error?

---

## 01 — basic position update

Script: `scripts/01-basic-position.mjs` — without openFeature fails (maxLevel=51, "not active and open"), with openFeature succeeds (maxLevel=31).

**Data:** `files/01-basic-position-position-update.json` — without openFeature: result=null, maxLevel=51; with openFeature: result=64, maxLevel=31.

**Learned:** openFeature is **required** before updateWorkPoint. Same pattern as updateWorkAxis and updateWorkCSys.
**📌 LLM doc:** openFeature/closeFeature required.

## 02 — update name

Script: `scripts/02-update-name.mjs` — rename without openFeature fails. With openFeature, rename succeeds and getWorkGeometry confirms new name; old name returns null.

**Data:** `files/02-update-name-name-update.json` — withOpen: result=54, maxLevel=31. getWorkGeometry "RenamedAgain" found (result=54), "OriginalName" not found (result=null, maxLevel=51).

**Learned:** Name update works correctly. Old name is replaced, not aliased.
**📌 LLM doc:** Name updates fully replace the old name.

## 03 — change type

Script: `scripts/03-change-type.mjs` — ✅ changed USERDEFINED → BREPVERTEX (with vertex ref), then back to USERDEFINED (with position). Both succeeded (maxLevel=31).

**Data:** `files/03-change-type-type-change.json` — both transitions succeeded with maxLevel=31.

**Learned:** Type changes work bidirectionally. Must provide appropriate params for new type (references for BREPVERTEX, position for USERDEFINED).
**📌 LLM doc:** Type changes supported, provide correct params for new type.

## 04 — update references

Script: `scripts/04-update-references.mjs` — ✅ changed BREPVERTEX reference from vertex1 to vertex2. Succeeded (maxLevel=31).

**Data:** `files/04-update-references-ref-change.json` — result=91, maxLevel=31.

**Learned:** Reference swapping works as expected.

## 05 — position on referenced type

Script: `scripts/05-position-on-referenced.mjs` — passing position=[999,999,999] to a BREPVERTEX work point succeeded (maxLevel=31, no error).

**Data:** `files/05-position-on-referenced-position-on-referenced.json` — result=91, maxLevel=31.

**Learned:** Position param on a referenced type is silently ignored (no error). The point stays at the vertex position.
**📌 LLM doc:** Position param ignored for referenced types — no error, just no effect.

## 06 — error cases

Script: `scripts/06-error-invalid-id.mjs` — tested 4 error cases:

1. **Bogus string ID** — maxLevel=51, "stol: no conversion" + "feature id does not exist"
2. **Part ID** — maxLevel=51, "not a feature or work geometry id"
3. **Invalid type string** — maxLevel=51, "not valid. Possible values are: [...]"
4. **BREPVERTEX with no refs** — interesting: result=58 (non-null!), maxLevel=51, "missing references for WP_err"

**Data:** `files/06-error-invalid-id-error-cases.json`

**Learned:** Changing type to BREPVERTEX without refs returns the feature ID but with error level. The feature may be in a broken state.
**📌 LLM doc:** Always provide references when changing to a referenced type. Missing refs returns feature ID but with error.

## 07 — partial update

Script: `scripts/07-partial-update.mjs` — ✅ name-only update preserves position/type. Position-only update preserves name. Verified via getWorkGeometry.

**Data:** `files/07-partial-update-partial-update.json` — all maxLevel=31, getWorkGeometry confirms name preserved.

**Learned:** Partial updates work as documented — unset params keep existing values.

---

## Coverage Checklist

- [x] The API has been called at least once successfully
- [x] Every required parameter (id) has been tested
- [x] Key optional parameters exercised (name, position, type, references)
- [x] Type change tested (USERDEFINED ↔ BREPVERTEX)
- [x] openFeature/closeFeature requirement confirmed
- [x] Error cases tested (invalid id, wrong id type, invalid type, missing refs)
- [x] Partial updates verified (name-only, position-only)
- [x] Behavioral claims verified with data (filewrite dumps, log values)
