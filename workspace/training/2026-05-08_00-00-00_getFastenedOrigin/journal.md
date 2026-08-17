# Training: assembly.getFastenedOrigin

**Date:** 2026-05-08

## Goal

Testing `v1.assembly.getFastenedOrigin` — query API for fastenedOrigin constraints.

**Methods to cover:**

- `getFastenedOrigin` — single query by name
- `getFastenedOrigin` — array/batch form
- Return value structure (id, name, mate1, offsets, rotations)
- Interaction with `fastenedOrigin` creation params
- Interaction with `updateFastenedOrigin` changes

**Questions:**

- What is the exact return shape? Are all fields always present?
- Does the `id` param accept instance IDs or only assembly root IDs?
- Are deg-string rotations stored/returned as radians?
- What happens when querying a nonexistent name?
- Does the array form work? What does a not-found entry look like in array results?
- After `updateFastenedOrigin`, does a re-query reflect the changes immediately?
- Do offsets from `useCurrentTransform` appear as regular numbers?
- Does querying with duplicate constraint names return the first match?

---

## 01 — basic query

Script: `scripts/01-basic-query.mjs` — ✅ as documented.

Created a fastenedOrigin with xOffset=25, yOffset=10, zOffset=5. Query by name returned complete object.

**Data:** All fields present in return: `id`, `name`, `mate1` (with `csys`, `flip`, `path`, `reorient`), `xOffset`, `yOffset`, `zOffset`, `xRotation`, `yRotation`, `zRotation`. Offsets match creation params exactly. Unset rotations default to `0`. Flip defaults to `"Z"`, reorient to `"0"`. maxLevel=31 (info). See `files/01-basic-query-basic-query-result.json`.

| ![basic](files/01-basic-query-basic-solid.png) |
|---|

📌 LLM doc: Return shape — all fields always present, defaults documented.

## 02 — deg string storage

Script: `scripts/02-deg-strings.mjs` — ✅ confirmed deg strings stored as radians.

Created with `xRotation: '45deg'`, `yRotation: '90deg'`, `zRotation: '180deg'`.

**Data:** Returned xRotation=0.7853981633974483, yRotation=1.5707963267948966, zRotation=3.141592653589793. All match expected radian conversions exactly. See `files/02-deg-strings-deg-strings-result.json`.

📌 LLM doc: Deg strings → radians in return value.

## 03 — nonexistent name

Script: `scripts/03-nonexistent-name.mjs` — ✅ as expected.

**Data:** result=null, maxLevel=51, error message: `"There couldn't be found a constraint with name \"DoesNotExist\" on product or product reference with id $12"`, code=0. See `files/03-nonexistent-name-nonexistent-result.json`.

📌 LLM doc: Nonexistent name returns null + maxLevel 51, code 0.

## 04 — wrong ID types (unexpected — doc discrepancy)

Script: `scripts/04-wrong-id-type.mjs` — ⚠️ partial discrepancy with docs.

**Data:**
- **Instance ID:** result=null, maxLevel=51, code=0, msg: `"The provided product or product reference id is not a Assembly."` — passes type check but fails at assembly-level validation.
- **Template ID:** result=null, maxLevel=51, code=1001, msg: `"The parameter \"id\" has a wrong id type! Provide only following id types: [\"assembly\",\"instance\"]"` — rejected at type-check level.
- **Constraint ID:** Same as template ID — code 1001, rejected at type-check level.

The type-check error says `["assembly","instance"]` are accepted types. Instance IDs pass this check but fail a second validation. This means the API schema intends to accept instance IDs, but the runtime rejects them. In practice, **only assembly root IDs work.** See `files/04-wrong-id-type-wrong-id-types.json`.

📌 LLM doc: Only assembly root ID works. Instance IDs pass type check but fail at runtime. Template/constraint IDs rejected at type check.

## 05 — array/batch form

Script: `scripts/05-array-form.mjs` — ✅ as documented.

**Data:**
- Both found: returns array of 2 objects, maxLevel=31.
- Mixed (one found, one missing): returns `[{...found...}, null]`, maxLevel=51 (reflects the not-found entry). See `files/05-array-form-array-form-results.json`.

📌 LLM doc: Array form returns array. Not-found entries are null. maxLevel reflects worst case.

## 06 — query after update + rename

Script: `scripts/06-after-update.mjs` — ✅ as documented.

**Data:**
- Before: xOffset=10, yOffset=20.
- After `updateFastenedOrigin({ id: foId, xOffset: 99, zRotation: '45deg' })`: xOffset=99, yOffset=20 (preserved), zRotation=0.7854 (radian). Changes reflected immediately.
- After rename to 'FO_Renamed': old name returns null (maxLevel=51), new name returns the constraint. Immediate. See `files/06-after-update-after-update.json`.

📌 LLM doc: Updates reflected immediately. Rename makes old name unfindable instantly.

## 07 — useCurrentTransform offsets

Script: `scripts/07-useCurrentTransform.mjs` — ✅ confirmed.

Instance placed at transformation `[[75, 30, 15], [1,0,0], [0,1,0]]`. Created fastenedOrigin with `useCurrentTransform: 1`.

**Data:** Back-computed offsets: xOffset=75, yOffset=30, zOffset=15. All rotations=0. The back-computed values match the instance transformation origin exactly. See `files/07-useCurrentTransform-useCurrentTransform-result.json`.

📌 LLM doc: useCurrentTransform offsets appear as regular numbers matching instance transformation.

## 08 — duplicate constraint names

Script: `scripts/08-duplicate-names.mjs` — ✅ confirmed first-match behavior.

Created two fastenedOrigin constraints both named 'SameName': foId1=121 (xOffset=10), foId2=125 (xOffset=90).

**Data:** Query returned id=121, xOffset=10 — the first constraint created. See `files/08-duplicate-names-duplicate-names.json`.

📌 LLM doc: Duplicate names return first match (by creation order).

## 09 — flip and reorient storage

Script: `scripts/09-flip-reorient.mjs` — ✅ as documented.

Created with `flip: '-Z'`, `reorient: '180'`.

**Data:** Returned mate1.flip=`"-Z"`, mate1.reorient=`"180"`, mate1.csys and mate1.path match creation values exactly. See `files/09-flip-reorient-flip-reorient-result.json`.

## 10 — instance ID error detail

Script: `scripts/10-instance-id-deeper.mjs` — confirms script 04 finding.

**Data:** Instance ID → code 0, msg "The provided product or product reference id is not a Assembly." The error path is different from template/constraint IDs (which get code 1001). Instance IDs are a valid type per the schema but rejected at the assembly-level check. See `files/10-instance-id-deeper-instance-id-detail.json`.

---

## Coverage Checklist

- [x] API called successfully (script 01)
- [x] Required parameters tested: `id` (assembly root), `name` (string)
- [x] Key optional: N/A (only `id` and `name`)
- [x] Array/batch form tested (script 05)
- [x] Error cases: nonexistent name (03), wrong ID types (04, 10)
- [x] Interaction with update (06), rename (06), useCurrentTransform (07)
- [x] Duplicate names (08)
- [x] Flip/reorient/deg string storage (02, 09)
- [x] Every question from Goal answered by named script
- [x] No spatial claims to verify (this is a query-only API)
