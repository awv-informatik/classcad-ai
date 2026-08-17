# Training: assembly.getFastenedOrigin

**Date:** 2026-04-29

## Goal

Testing `v1.assembly.getFastenedOrigin` — retrieves a fastenedOrigin constraint by name.

**Methods to cover:**

- `getFastenedOrigin` — basic retrieval by name, return value structure
- `getFastenedOrigin` — verify all returned fields: id, name, mate1 (path, csys, flip, reorient), offsets, rotations
- `getFastenedOrigin` — rotation values returned as radians (even when created with degree strings)
- `getFastenedOrigin` — flip and reorient values
- `getFastenedOrigin` — error: name not found
- `getFastenedOrigin` — error: wrong ID type (instance ID, constraint ID)
- `getFastenedOrigin` — duplicate names (first match behavior)
- `getFastenedOrigin` — retrieval after updateFastenedOrigin
- `getFastenedOrigin` — batch retrieval (array param)
- `getFastenedOrigin` — sub-assembly path
- `getFastenedOrigin` — instance ID of sub-assembly (accepted!)
- `getFastenedOrigin` — missing params
- `getFastenedOrigin` — useCurrentTransform read-back

**Questions:**

- What exact fields are returned in the result object?
- Are default values (flip='Z', reorient='0', offsets=0, rotations=0) included in the response or omitted?
- Does it work with instance IDs or only assembly IDs?
- How does it behave with batch input?
- After update, does get reflect the new values?

---

## 01 — basic retrieval

Script: `scripts/01-basic-get.mjs` — ✅ Returns full constraint state including all defaults.

| ![result](files/01-basic-get-result-solid.png) |
|---|

**Data:** Result is an object with keys: `id`, `name`, `mate1` (with `csys`, `flip`, `path`, `reorient`), `xOffset`, `xRotation`, `yOffset`, `yRotation`, `zOffset`, `zRotation`. maxLevel 31 on success. All default values are explicitly returned (offsets=0, rotations=0, flip="Z", reorient="0").

**📌 LLM doc:** Return value structure — all fields always present, defaults included explicitly.

## 02 — offsets

Script: `scripts/02-with-offsets.mjs` — ✅ Offsets correctly returned: xOffset=50, yOffset=-20, zOffset=15. Exact values, no rounding.

| ![result](files/02-with-offsets-offset-result-solid.png) |
|---|

**Data:** `xOffset: 50, yOffset: -20, zOffset: 15` (see `files/02-with-offsets-get-offsets.json`). Negative values preserved.

## 03 — rotations (radians)

Script: `scripts/03-with-rotations.mjs` — ✅ Radian values returned with full float precision.

| ![result](files/03-with-rotations-rotation-result-solid.png) |
|---|

**Data:** xRotation=0.7853981633974483 (PI/4), yRotation=0.5235987755982988 (PI/6), zRotation=1.5707963267948966 (PI/2). Exact match with input.

## 04 — degree strings stored as radians

Script: `scripts/04-degree-strings.mjs` — ✅ Degree strings ('45deg', '30deg', '90deg') are stored as radians. `getFastenedOrigin` returns the radian equivalents, not the original strings. Values are numeric, not strings.

**Data:** xRotation=0.785 (45deg→rad), yRotation=0.524 (30deg→rad), zRotation=1.571 (90deg→rad). `typeof xRotation === 'number'` is true.

**📌 LLM doc:** Rotations always returned as radians, even when created with degree strings.

## 05 — flip and reorient

Script: `scripts/05-flip-reorient.mjs` — ✅ mate1.flip="-X", mate1.reorient="180" correctly returned as strings.

| ![result](files/05-flip-reorient-flip-result-solid.png) |
|---|

**Data:** mate1 keys: `csys`, `flip`, `path`, `reorient`. flip="-X" (string), reorient="180" (string). See `files/05-flip-reorient-get-flip-reorient.json`.

## 06 — name not found

Script: `scripts/06-name-not-found.mjs` — ✅ Returns null with maxLevel 51.

**Data:** result=null, maxLevel=51, error code=0, message: "There couldn't be found a constraint with name \"DOES_NOT_EXIST\" on product or product reference with id $12". See `files/06-name-not-found-not-found.json`.

**📌 LLM doc:** Name not found → null, maxLevel 51, code 0.

## 07 — wrong ID types

Script: `scripts/07-wrong-id-type.mjs` — ✅ Different errors for different ID types.

**Data:**
- **Part instance ID:** "The provided product or product reference id is not a Assembly." (no specific code — code=0). This is because the instance references a part template, not an assembly.
- **Constraint ID:** code 1001, "The parameter \"id\" has a wrong id type! Provide only following id types: [\"assembly\",\"instance\"]"
- **Part template ID:** code 1001, same message as constraint ID.

**Learned:** The API accepts `assembly` and `instance` ID types. Part instances fail because they don't resolve to an assembly product. Constraint and template IDs are rejected at the type level.

**📌 LLM doc:** Accepted ID types are assembly and instance. Part instances error with "not a Assembly" — only sub-assembly instances work (see script 13).

## 08 — duplicate names

Script: `scripts/08-duplicate-names.mjs` — ✅ First match wins. Two constraints named "SameName" (fo1 with xOffset=10, fo2 with xOffset=99). Get returns fo1 (id=121, xOffset=10).

**Data:** returned id=121 matches fo1, not fo2. xOffset=10 confirms first-created constraint returned. See `files/08-duplicate-names-duplicate-names.json`.

**📌 LLM doc:** First match wins for duplicate names.

## 09 — after update

Script: `scripts/09-after-update.mjs` — ✅ Get reflects updated values. Also confirms renamed constraint is only findable by new name.

**Data:**
- Before: xOffset=10, yOffset=20
- After update (xOffset=77, zRotation='45deg'): xOffset=77, yOffset=20 (preserved), zRotation=0.785
- Old name after rename: null, maxLevel=51
- New name after rename: id=119, maxLevel=31

**📌 LLM doc:** Get always reflects current state after update. Renamed constraints lose old name.

## 10 — batch retrieval

Script: `scripts/10-batch-get.mjs` — ✅ Array param returns array of results.

**Data:** Passed `[{ id, name: 'FO_A' }, { id, name: 'FO_B' }]`. Result is array of two full constraint objects. Each has distinct path, xOffset. maxLevel=31.

**📌 LLM doc:** Batch retrieval supported — pass array, get array.

## 11 — defaults check

Script: `scripts/11-defaults-check.mjs` — ✅ All defaults explicitly present.

**Data:** Result keys: `id, mate1, name, xOffset, xRotation, yOffset, yRotation, zOffset, zRotation`. All offsets=0, all rotations=0, mate1.flip="Z", mate1.reorient="0". mate1 keys: `csys, flip, path, reorient`. No fields are omitted — all defaults are always returned.

## 12 — sub-assembly scope

Script: `scripts/12-sub-assembly.mjs` — ✅ Constraints are scoped to the assembly they were created in.

| ![result](files/12-sub-assembly-sub-asm-solid.png) |
|---|

**Data:**
- `getFastenedOrigin({ id: subAsmTpl, name: 'SubFO' })` → success (maxLevel 31)
- `getFastenedOrigin({ id: rootAsm, name: 'SubFO' })` → null (maxLevel 51) — constraint lives on sub-assembly, not root

**📌 LLM doc:** Constraints are scoped to the assembly where created. Looking on root for a sub-assembly's constraint returns null.

## 13 — sub-assembly instance ID

Script: `scripts/13-instance-id-subasm.mjs` — ✅ **Key finding:** Sub-assembly instance IDs work!

**Data:** Both `subAsmTpl` and `subAsmInst` return the same constraint (id=129, xOffset=42). Messages empty. maxLevel 31. The instance ID resolves through to the sub-assembly template it references.

**Learned:** `id` accepts both assembly IDs and instance IDs of sub-assembly instances. Part instance IDs fail ("not a Assembly"). This means you can look up constraints on a sub-assembly via either the template or an instance of it.

**📌 LLM doc:** Instance IDs of sub-assembly instances work — resolves to the sub-assembly template. Part instance IDs fail.

## 14 — missing params

Script: `scripts/14-missing-params.mjs` — ✅ Both `id` and `name` are required.

**Data:**
- No name: code 1004, "The parameter \"name\" must be provided in the api call!"
- No id: code 1004, "The parameter \"id\" must be provided in the api call!"
- Empty object: same as no id (code 1004)

## 15 — useCurrentTransform read-back

Script: `scripts/15-useCurrentTransform-get.mjs` — ✅ After creating with `useCurrentTransform: 1`, get shows the computed offsets.

**Data:** Instance placed at [80, 40, 25]. After `fastenedOrigin({ ..., useCurrentTransform: 1 })`, `getFastenedOrigin` returns xOffset=80, yOffset=40, zOffset=25, all rotations=0. The UCT flag computes and stores real values.

**📌 LLM doc:** useCurrentTransform computes and stores actual offsets/rotations — get returns the computed values, not a flag.

---

## Coverage Checklist

- [x] API called successfully (scripts 01-05, 09-13, 15)
- [x] Both required params tested (id, name)
- [x] All return value fields verified (id, name, mate1.path, mate1.csys, mate1.flip, mate1.reorient, all offsets, all rotations)
- [x] Default values checked (all present, all explicit)
- [x] Error cases: name not found, wrong ID types, missing params
- [x] Duplicate names (first match wins)
- [x] After update reflects current state
- [x] Batch retrieval (array param → array result)
- [x] Sub-assembly scope (constraint scoped to creating assembly)
- [x] Sub-assembly instance IDs work
- [x] useCurrentTransform read-back
- [x] Degree strings stored as radians
