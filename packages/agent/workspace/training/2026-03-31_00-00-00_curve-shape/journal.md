# Training: curve.shape / deleteShape / cleanShape

**Date:** 2026-03-31

## Goal

Testing `v1.curve.shape`, `v1.curve.deleteShape`, and `v1.curve.cleanShape` — the shape container APIs.

**Methods to cover:**

- `shape` — create a shape container inside an entity injection
- `shape` params: `id` (required, EI feature ID), `name` (optional, defaults to "Shape")
- `deleteShape` — delete shapes entirely via `ids` array
- `cleanShape` — delete curves inside shapes but keep containers

**Questions:**

- What ID does `shape` return? Is it the same type hierarchy as EI IDs?
- What happens with duplicate names? Does auto-suffixing work like EI?
- Can you create multiple shapes in one EI?
- What does the structure tree look like for a shape?
- What happens when you deleteShape — is it a cascade?
- What happens when you cleanShape on an empty shape?
- What happens when you cleanShape on a shape with curves?
- Can you reuse a cleaned shape for new curves?
- Error cases: wrong ID type, non-existent ID, empty ids array

---

## 01 — Basic shape creation

Script: `scripts/01-basic-shape.mjs` — ✅ Creates shapes with default and custom names.

| ![two-shapes](files/01-basic-shape-two-shapes.png) |
|---|

**Data:** Default-named shape returned ID 60, custom-named "MyShape" returned ID 62. Both maxLevel=31 (info), empty messages. Shapes are `CC_CurveEntity` class nodes, children of the EI (parent=54). Members: `consumed` (always 1) and `_VERSION`.

**📌 LLM doc:** Shape class is `CC_CurveEntity`, not `CC_Shape`. Return value is a numeric ID.

## 02 — Duplicate shape names

Script: `scripts/02-duplicate-names.mjs` — ✅ Auto-suffixing works exactly like EI and part naming.

**Data:** Three shapes named "Foo" → "Foo", "Foo0", "Foo1". Three default-named → "Shape", "Shape0", "Shape1" (see `files/05-default-names-default-names.json`).

**📌 LLM doc:** Auto-suffixing: first shape keeps exact name, subsequent duplicates get 0, 1, 2... suffix.

## 03 — Error cases: wrong ID type

Script: `scripts/03-wrong-id-type.mjs` — ✅ All error cases produce clear error messages.

**Data (see `files/03-wrong-id-type-error-cases.json`):**
- Part ID as `id` → code 1001, level 51: `"Provide only following id types: [\"entityinjection\"]"`
- Non-existent ID → code 1006, level 51: `"An element of parameter \"id\" has an invalid id!"` (preceded by warning code 0: "ToId()/TOID() didn't get an existing or valid id.")
- Missing `id` → code 1004, level 51: `"The parameter \"id\" must be provided in the api call!"`

**📌 LLM doc:** Document error codes and messages for shape creation.

## 04 — Shape with curves (structure)

Script: `scripts/04-shape-with-curves.mjs` — ✅ Curves add to shape; shape has no `children` array.

**Data:** Line and circle return VOID (null), maxLevel 31. Shape node has no `children` property — curves don't appear as child nodes.

## 05 — Default names

Script: `scripts/05-default-names.mjs` — ✅ Confirmed: "Shape", "Shape0", "Shape1".

## 06 — Curve structure investigation

Script: `scripts/06-curve-structure.mjs` — ✅ Reveals `geometryIdList` on shape nodes.

**Data (see `files/06-curve-structure-curve-structure.json`):** Shape node has `geometryIdList: [61]` after adding 2 curves (line + circle). Curves share one geometry ID — they're stored in a single geometry entity, not individual nodes. No nodes are parented to the shape. Shape keys: `name, class, id, flags, geometryIdList, parent, members`.

| ![curves-in-shape](files/06-curve-structure-curves-in-shape.png) |
|---|

**📌 LLM doc:** Curves don't appear as children. Shape has `geometryIdList` pointing to geometry entities. Multiple curves share geometry IDs.

## 07 — deleteShape

Script: `scripts/07-deleteShape.mjs` — ✅ Deletes shapes (including non-empty ones) cleanly.

**Data:** `deleteShape({ ids: [s2, s3] })` returns VOID, maxLevel 31. After deletion, shapes gone from structure. EI children array only contains surviving shape. Non-empty shapes (with curves) also deleted without issues.

## 08 — cleanShape (first attempt)

Script: `scripts/08-cleanShape.mjs` — ⚠️ Internal server error but operation succeeds.

**Data:** `cleanShape` returned maxLevel=51 with internal error: `"Trying to open database which does not exist"` (CCDatabase.cpp line 79). BUT: shape survives, and `geometryIdList` went from having entries to `undefined` (empty). The `consumed` member stayed at 1.

## 09 — Reuse cleaned shape

Script: `scripts/09-reuse-cleaned.mjs` — ✅ Cleaned shapes can be reused for new curves.

| ![before-clean](files/09-reuse-cleaned-before-clean.png) | ![after-clean](files/09-reuse-cleaned-after-clean.png) | ![after-reuse](files/09-reuse-cleaned-after-reuse.png) |
|---|---|---|

**Data:** After clean + new circle, `geometryIdList: [66]` — new geometry entity created. The cleaned shape works normally.

**📌 LLM doc:** cleanShape is reusable. Despite error messages, it works functionally.

## 10 — cleanShape (verified)

Script: `scripts/10-cleanShape-v2.mjs` — Confirmed script 08 findings with better before/after data.

**Data:** Before: `geometryIdList: [61]`. After cleanShape: shape exists, `geometryIdList: undefined`. maxLevel=51 with same internal error. Operation works despite error.

**📌 LLM doc:** cleanShape always reports maxLevel=51 with internal database error. The error is misleading — the operation succeeds. Do not treat maxLevel=51 as failure for cleanShape.

## 11 — deleteShape error cases

Script: `scripts/11-deleteShape-errors.mjs` — ✅ All error paths documented.

**Data (see `files/11-deleteShape-errors-deleteShape-errors.json`):**
- First delete: maxLevel 31 (OK)
- Double delete (already deleted): code 1006, level 51 — "invalid id"
- Empty array: maxLevel 31, no error (noop)
- Part ID: code 1001, level 51 — `"Provide only following id types: [\"shape\"]"`
- EI ID: same code 1001 — only accepts shape IDs

**📌 LLM doc:** deleteShape requires shape IDs (not EI or part IDs). Empty array is OK. Double-delete is an error.

## 12 — cleanShape on empty shape

Script: `scripts/12-cleanShape-empty.mjs` — ⚠️ Same internal error even on empty shapes.

**Data:** `cleanShape` on a shape with no curves still produces the internal database error (maxLevel=51). Shape survives. This confirms the error is a server-side bug, not user-triggered.

## 13 — consumed member

Script: `scripts/13-consumed-member.mjs` — `consumed` is always 1, never changes.

**Data:** Before curves: `{value: 1}`. After adding curve: `{value: 1}`. After clean: `{value: 1}`. It's a fixed property, not a curve counter.

## 14 — Rename shape

Script: `scripts/14-rename-shape.mjs` — ✅ `setObjectName` works on shapes.

**Data:** `setObjectName({ id: shapeId, name: 'Renamed' })` returns VOID, maxLevel 31. Name updated to "Renamed" in structure tree.

## 15 — Shapes in multiple EIs

Script: `scripts/15-shape-in-multiple-ei.mjs` — ✅ Shapes are parented to their respective EI.

| ![shapes-in-two-eis](files/15-shape-in-multiple-ei-shapes-in-two-eis.png) |
|---|

**Data:** s1 (in EI1) has parent=54 (ei1), s2 (in EI2) has parent=62 (ei2). Each shape is scoped to its EI.

---

## Coverage Summary

All questions answered:
- Shape returns a numeric ID (type "shape"). Class is `CC_CurveEntity`.
- Auto-suffixing works same as EI/part naming.
- Multiple shapes per EI: yes, they're children of the EI.
- Structure: shape node has `geometryIdList`, `consumed` member (always 1), `_VERSION`. No `children` for curves.
- deleteShape: cascade deletes shapes and curves. Requires shape IDs.
- cleanShape: removes curves, keeps container. Always reports internal error (maxLevel=51) but works.
- Reuse: cleaned shapes accept new curves normally.
- Renaming: `setObjectName` works on shape IDs.

