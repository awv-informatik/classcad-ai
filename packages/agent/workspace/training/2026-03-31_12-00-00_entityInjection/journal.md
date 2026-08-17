# Training: part.entityInjection

**Date:** 2026-03-31

## Goal

Testing `v1.part.entityInjection` — the container feature that holds direct geometry (solids from `solid.*` and curves from `curve.shape`).

**Methods to cover:**

- `entityInjection` — create with default name
- `entityInjection` — create with custom `name` param
- `entityInjection` — multiple entity injections in one part
- `entityInjection` — what happens without `id` param (missing part)
- `entityInjection` — verify returned ID is what `solid.box` and `curve.shape` expect as `id`
- `entityInjection` — verify in structure tree (feature type, position, properties)

**Questions:**

- What does the returned ID represent — a feature ID? An object ID?
- Can you create multiple entity injections in one part?
- What happens if you omit `id` (no part)?
- What happens if you pass an invalid ID?
- Does the `name` parameter affect anything beyond display?
- How does the entity injection appear in the structure tree?
- Can you use `common.setObjectName` to rename it after creation?
- Can you delete an entity injection? (no `deleteEntityInjection` in the docs — what about `part.deleteFeature`?)
- Does `openFeature`/`closeFeature` apply to entity injections?

---

## 01 — Basic creation with defaults

Script: `scripts/01-basic-create.mjs` — ✅ Creates EI with default name.

**Data:** partId=4, eifId=54, maxLevel=31, messages=[]. Structure tree node: class=`CC_EntityInjection`, name="EntityInjection", parent=16 (`CC_EntitySet`). Members: `bodies` (empty array), `solidOperation` (0), `_VERSION`. A companion node at id=56: `CC_OperationReference` named "EntityInjectionRef", parent=18 (`CC_OperationSequence`).

**📌 LLM doc:** Default name is "EntityInjection". Returns feature ID. Two nodes created: the EI itself in EntitySet, and a ref node in OperationSequence.

## 02 — Custom name

Script: `scripts/02-custom-name.mjs` — ✅ Custom name works as expected.

**Data:** `entityInjection({ id: partId, name: 'MyInjection' })` → result=54, node.name="MyInjection", class=CC_EntityInjection.

## 03 — Multiple entity injections in one part

Script: `scripts/03-multiple-ei.mjs` — ✅ Multiple EIs in one part work.

**Data:** Three EIs created: ids=[54, 62, 70] (incrementing by 8). All have parent=16 (same CC_EntitySet). Names: "EI_One", "EI_Two", "EI_Three".

**📌 LLM doc:** Multiple EIs per part are supported. Each gets its own ID.

## 04 — Missing and invalid ID

Script: `scripts/04-missing-id.mjs` — ✅ Error handling as expected.

**Data:**
- No `id` param: result=null, maxLevel=51, error code 1004: `"id" must be provided to create CC_EntityInjection`
- Invalid `id` (999999): result=null, maxLevel=51, three messages: warning code 0 (ToId() invalid), error code 1006 (part id does not exist), error code 1004 (id must be provided)

**📌 LLM doc:** `id` is required. Error 1004 for missing, 1006 for invalid part ID.

## 05 — Entity injection with solid.box

Script: `scripts/05-ei-with-solid.mjs` — ✅ (after fixing params: `length/width/height`, not `x/y/z`)

| ![box-in-ei](files/05-ei-with-solid-box-in-ei.png) |
|---|

**Data:** boxId=61, maxLevel=31. EI `members.bodies` is empty even after adding a solid — bodies tracked via `children` array instead. First attempt used wrong params (x/y/z) and got error 1014.

**📌 LLM doc:** solid.box params are `length`/`width`/`height`, not x/y/z. The `bodies` member in the EI structure node is always empty — actual children are in the `children` array.

## 06 — Entity injection with curve.shape

Script: `scripts/06-ei-with-curve.mjs` — ✅ curve.shape works with EI ID.

**Data:** `curve.shape({ id: eifId })` → shapeId=60, maxLevel=31. `curve.line` inside the shape also works (maxLevel=31, result=null which is normal for line creation).

**📌 LLM doc:** Both solid and curve APIs accept the EI ID as their `id` parameter.

## 07 — Duplicate names

Script: `scripts/07-duplicate-names.mjs` — ✅ Duplicate names auto-suffixed.

**Data:** Three EIs all named "Same": actual names are "Same", "Same0", "Same1". IDs: 54, 62, 70.

**📌 LLM doc:** Duplicate names get auto-numbered suffix starting at 0 (e.g., "Same", "Same0", "Same1"). First keeps exact name.

## 08 — EI bodies inspection after solids

Script: `scripts/08-ei-bodies-inspect.mjs` — ✅ Confirms bodies member behavior.

**Data:** Two boxes in one EI. `members.bodies` still empty. `children` = [61, 64] (the solid feature IDs). `part.solids` = [59, 62] (different IDs — these are the geometry-level solid IDs).

**📌 LLM doc:** EI `children` contains solid feature IDs. `part.solids` contains geometry-level IDs (different from feature IDs). The `bodies` member in structure tree is always empty — do not rely on it.

## 09 — Rename with setObjectName

Script: `scripts/09-rename-ei.mjs` — ✅ Renaming works.

**Data:** `setObjectName({ id: eifId, name: 'Renamed' })` → result=null (VOID), maxLevel=31. Structure tree confirms name changed to "Renamed".

## 10 — deleteFeature with wrong signature

Script: `scripts/10-delete-feature.mjs` — ❌ `deleteFeature({ id: eifId })` fails: error 1004 "The parameter 'ids' must be provided".

**📌 LLM doc:** `deleteFeature` takes `ids` array, not `id`. Common mistake.

## 11 — deleteFeature with correct signature

Script: `scripts/11-delete-feature-v2.mjs` — ✅ Deletion works and cascades.

**Data:** `deleteFeature({ ids: [eifId] })` → result=null, maxLevel=31. Both the EI node and its contained box are gone from the structure tree.

**📌 LLM doc:** `deleteFeature({ ids: [eifId] })` deletes the EI and all its contents (cascade delete).

## 12 — openFeature / closeFeature

Script: `scripts/12-open-close-feature.mjs` — ✅ Both accept EI IDs without error.

**Data:** `openFeature({ id: eifId })` → VOID, maxLevel=31. `closeFeature({ id: eifId })` → VOID, maxLevel=31. No messages on either.

## 13 — solid.box on part ID (wrong ID type)

Script: `scripts/13-solid-on-part-id.mjs` — ✅ Expected error confirms EI is required.

**Data:** `solid.box({ id: partId })` → result=null, maxLevel=51, error 1001: `The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]`

**📌 LLM doc:** Critical — solid and curve APIs require an entity injection ID, not a part ID. The error message explicitly lists the required type.

## 14 — Retrieve EI by name

Script: `scripts/14-get-ei-by-name.mjs` — ✅ No name-based retrieval available.

**Data:** `getWorkGeometry({ id: partId, name: 'MyEI' })` → error 1015 "Couldn't find work geometry". `getSketch({ id: partId, name: 'MyEI' })` → error 1015 "Sketch does not exist".

**📌 LLM doc:** No API to retrieve an EI by name. You must store the ID from creation. Entity injections are not work geometries and not sketches.

## 15 — Companion reference node

Script: `scripts/15-ei-ref-node.mjs` — ✅ Confirms two-node structure.

**Data:** EI feature node (id=54) lives under `CC_EntitySet` (parent=16). Companion `CC_OperationReference` node (id=56, name="EntityInjectionRef") lives under `CC_OperationSequence` (parent=18). The ref node is always at eifId+2 with name `<eiName>Ref`.

## 16 — Realistic workflow (box + cylinder)

Script: `scripts/16-realistic-workflow.mjs` — ✅ (after fixing cylinder param: `diameter`, not `radius`)

| ![two-solids](files/16-realistic-workflow-workflow-two-solids.png) |
|---|

**Data:** box (id=61) + cylinder (id=64) in same EI. EI children=[61,64], part.solids=[59,62].

---

## Coverage Checklist

- [x] The API has been called at least once successfully
- [x] Every required parameter has been tested (`id` — scripts 01-04)
- [x] Key optional parameters have been exercised (`name` — scripts 02, 07)
- [x] N/A — no enum values
- [x] No `updateEntityInjection` exists; tested `deleteFeature` (scripts 10-11) and `setObjectName` (script 09)
- [x] Realistic usage combining EI with solid and curve APIs (scripts 05, 06, 16)
- [x] Behavioral claims verified with data (structure tree dumps, filewrite throughout)
