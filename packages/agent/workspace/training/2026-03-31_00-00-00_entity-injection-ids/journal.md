# Training: Entity Injection IDs and Curve/Solid API Relationships

**Date:** 2026-03-31

## Goal

Studying the relationship between entity injection IDs and the `id` parameters expected by `solid.*` and `curve.*` APIs. This is a conceptual task — the entity injection acts as the bridge between part-level features and direct geometry APIs.

**Questions to answer:**

- What ID does each API domain expect? Part ID vs. entity injection ID vs. shape ID?
- Can you pass a part ID directly to `solid.box`? What error do you get?
- Can you pass an entity injection ID to `curve.line`? Or does it need a shape ID?
- Can you create multiple solids in the same entity injection?
- Can you create multiple shapes in the same entity injection?
- Can solids from one entity injection reference/interact with solids from another?
- What's the structure tree relationship between EI → solids and EI → shapes → curves?
- Do solid IDs from `solid.box` differ from the IDs in the structure tree?
- Can you mix solids and shapes in the same entity injection?

---

## 01 — wrong ID to solid.box

Script: `scripts/01-wrong-id-to-solid.mjs` — ❌ Error as expected.

Passing a part ID (4) to `solid.box` → maxLevel=51, error 1001: `The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]`.

**Learned:** `solid.*` APIs strictly require an entity injection ID. The error message is helpful — it names the expected type.

📌 LLM doc: Document the error message format for wrong ID types — it always names the expected type.

## 02 — correct ID to solid.box

Script: `scripts/02-correct-id-to-solid.mjs` — ✅ Works as expected.

partId=4, eifId=54, boxId=61. The chain is part → EI → solid.

| ![box-in-ei](files/02-correct-id-to-solid-box-in-ei.png) |
|---|

## 03 — wrong IDs to curve.line

Script: `scripts/03-wrong-id-to-curve.mjs` — ❌ Both fail as expected.

- `curve.line(eifId=54)` → error 1001: `Provide only following id types: ["shape"]`
- `curve.line(partId=4)` → error 1001: `Provide only following id types: ["shape"]`

**Learned:** Curve drawing APIs (line, arc, circle, etc.) require a **shape** ID — neither part ID nor EI ID is accepted. The chain is part → EI → shape → curves.

📌 LLM doc: Curve APIs require shape IDs, not EI IDs. The EI→shape→curve chain is two levels deep.

## 04 — correct curve flow

Script: `scripts/04-correct-curve-flow.mjs` — ✅ Works as expected.

partId=4, eifId=54, shapeId=60. `curve.line` returns null result (VOID) with maxLevel=31.

| ![line-in-shape](files/04-correct-curve-flow-line-in-shape.png) |
|---|

**Note:** Curve creation APIs return VOID (null), not an ID. This is different from solid APIs which return solid IDs.

📌 LLM doc: Curve creation APIs return VOID, not an ID. You can't reference individual curves by ID.

## 05 — multiple solids in one EI

Script: `scripts/05-multiple-solids-one-ei.mjs` — ✅ All three solids created.

box1=61, box2=64, cyl=67 — all in eifId=54. Each solid gets a sequential ID.

| ![multiple-solids](files/05-multiple-solids-one-ei-multiple-solids-one-ei.png) |
|---|

**Side finding:** `solid.cylinder` uses `diameter` not `radius`. First attempt with `radius` parameter returned null silently.

📌 LLM doc: Multiple solids can coexist in one EI. solid.cylinder uses `diameter`, not `radius`.

## 06 — multiple shapes in one EI

Script: `scripts/06-multiple-shapes-one-ei.mjs` — ✅ Both shapes created.

shape1=60, shape2=62 in eifId=54. Lines added to both — both return VOID with maxLevel=31.

| ![multiple-shapes](files/06-multiple-shapes-one-ei-multiple-shapes-one-ei.png) |
|---|

## 07 — mixed solids and shapes in same EI

Script: `scripts/07-mix-solids-and-shapes.mjs` — ✅ Works fine.

boxId=61, shapeId=63 in eifId=54. Solids and shapes coexist in the same EI.

| ![mixed](files/07-mix-solids-and-shapes-mixed-solid-and-shape.png) |
|---|

📌 LLM doc: Solids and shapes can coexist in the same entity injection.

## 08 — cross-EI boolean (subtraction)

Script: `scripts/08-two-eis-interaction.mjs` — ✅ Cross-EI subtraction works!

ei1=54, ei2=62, box1=69 (in ei1), box2=72 (in ei2). `solid.subtraction({ id: ei1, target: box1, tools: [box2] })` succeeded (result=69, maxLevel=31).

| ![before](files/08-two-eis-interaction-two-eis-before-subtraction.png) | ![after](files/08-two-eis-interaction-two-eis-after-subtraction.png) |
|---|---|

**Learned:** Boolean operations work across EI boundaries. The `id` param specifies which EI the operation belongs to, but `target` and `tools` can reference solids from any EI.

**Side finding:** API names are `solid.union`, `solid.subtraction`, `solid.intersection` — not `solid.boolean`.

📌 LLM doc: Cross-EI boolean operations work. Target/tools can come from different EIs.

## 09 — structure tree analysis

Script: `scripts/09-structure-tree-ids.mjs` — ✅ Structure dumped.

Key structure findings from `files/09-structure-tree-ids-structure-after-solids.json`:

- **EI node (id:54)** — `class: CC_EntityInjection`, `children: [61, 64]` (the CC_Solid nodes). `bodies` member is empty array (confirms existing LLM doc finding).
- **CC_Solid (id:61)** — `parent: 54`, `geometryIdList: [59]`. The feature-level ID is 61 (returned by API), the geometry ID is 59.
- **Part (id:4)** — `solids: [59, 62]` — geometry-level IDs, NOT the feature-level IDs returned by solid.box.

**Two IDs per solid confirmed:**
- Feature-level: 61, 64 (in EI.children, returned by solid.* creation)
- Geometry-level: 59, 62 (in part.solids, inside CC_Solid.geometryIdList)

📌 LLM doc: Feature-level IDs (from API) vs geometry-level IDs (in part.solids). Use the feature-level IDs for all solid.* calls.

## 10 — part.box vs solid.box

Script: `scripts/10-ei-id-vs-part-feature-id.mjs` — ✅ Both work, different ID chains.

- `part.box({ id: partId })` → returns feature ID 54 (a box FEATURE in the part's feature tree)
- `solid.box({ id: eifId })` → returns solid ID 127 (direct geometry inside an EI)

| ![part-box](files/10-ei-id-vs-part-feature-id-part-box-feature.png) | ![both](files/10-ei-id-vs-part-feature-id-part-box-plus-solid-box.png) |
|---|---|

**Learned:** `part.box` and `solid.box` are completely different APIs:
- `part.box` = parametric feature (lives in feature tree, can be updated via openFeature/updateBox/closeFeature)
- `solid.box` = direct geometry (lives in EI, no feature history)

📌 LLM doc: part.box ≠ solid.box. Different ID expectations, different mental models.

## 11 — solid.deleteSolid with feature-level ID

Script: `scripts/11-solid-id-in-delete.mjs` — ✅ Deletion works with feature-level ID.

`solid.deleteSolid({ id: eifId, ids: [box2FeatureId] })` succeeded (maxLevel=31). The feature-level ID (returned by solid.box) is what you pass to deleteSolid.

| ![before](files/11-solid-id-in-delete-before-delete.png) | ![after](files/11-solid-id-in-delete-after-delete.png) |
|---|---|

## 12 — shape ID into solid.box

Script: `scripts/12-shape-id-wrong-for-solid.mjs` — ❌ Rejected as expected.

`solid.box({ id: shapeId })` → error 1001: `Provide only following id types: ["entityinjection"]`.

Shape IDs are for curves only. Solid APIs demand EI IDs.

## 13 — cross-EI solid copy

Script: `scripts/13-solid-copy-across-eis.mjs` — ✅ Cross-EI copy works.

`solid.copy({ id: ei2, target: boxFromEi1 })` succeeded (result=73, maxLevel=31). The copy lives in ei2, source remains in ei1.

| ![before](files/13-solid-copy-across-eis-before-copy.png) | ![after](files/13-solid-copy-across-eis-after-copy.png) |
|---|---|

📌 LLM doc: Cross-EI copy works. `id` = destination EI, `target` = source solid from any EI.

## 14 — comprehensive ID type validation

Script: `scripts/14-full-id-chain.mjs` — ✅ All type checks match expectations.

| Call | ID Passed | Expected | Result |
|------|-----------|----------|--------|
| `curve.line(eifId)` | entityinjection | shape | ❌ rejected |
| `solid.box(shapeId)` | shape | entityinjection | ❌ rejected |
| `solid.box(partId)` | part | entityinjection | ❌ rejected |
| `curve.shape(partId)` | part | entityinjection | ❌ rejected |
| `curve.line(boxId)` | solid | shape | ❌ rejected |
| `curve.shape(eifId)` | entityinjection | entityinjection | ✓ accepted |

All errors use code 1001 with message `The parameter "id" has a wrong id type! Provide only following id types: ["<expected>"]`.

📌 LLM doc: The server strictly validates ID types. Error 1001 always tells you what type was expected.

---

## Summary of Findings

### ID Hierarchy

```
Part (part.create → partId)
├─ part.* features (box, extrusion, etc.) ← id: partId
│
└─ Entity Injection (part.entityInjection → eifId)
   ├─ solid.* (box, cylinder, etc.) ← id: eifId
   │   └─ Returns solid feature IDs (used for delete, copy, boolean target/tools)
   │
   └─ curve.shape (→ shapeId)
       └─ curve.* (line, arc, circle, etc.) ← id: shapeId
           └─ Returns VOID (individual curves are not addressable by ID)
```

### Key Rules

1. **`solid.*` APIs require entity injection IDs** — not part IDs, not shape IDs, not solid IDs
2. **`curve.*` drawing APIs require shape IDs** — not EI IDs, not part IDs
3. **`curve.shape` requires an entity injection ID** — creating the shape container is one level up from drawing curves
4. **Cross-EI references work** for boolean operations (target/tools) and copy operations
5. **Two IDs per solid:** feature-level (in EI.children, returned by API) vs. geometry-level (in part.solids)
6. **Curve APIs return VOID** — individual curves are not addressable by ID after creation
7. **Error 1001** with descriptive message whenever wrong ID type is passed

### Coverage Checklist

- [x] Each stated question answered with evidence
- [x] Edge cases probed (wrong ID types, cross-EI operations)
- [x] Findings grounded in observed server responses
- [x] Concept tested across solid, curve, and part domains
- [x] Key findings backed by filewrite data
