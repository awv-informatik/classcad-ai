# Training: part.create

**Date:** 2026-03-23

## Goal

Testing `v1.part.create` — the foundational container creation API.

**Methods to cover:**

- `part.create` with name param
- `part.create` with no params / empty object
- `part.create` with default name
- Multiple `part.create` calls — does second clear the first?
- Return value — ID type, value
- Structure tree after creation
- Envelope shape

**Questions:**

- What ID is returned? Always the same number?
- Does calling `part.create` twice clear the first part?
- What does the structure tree look like after creation?
- What happens with extra/unknown params?
- Is the name visible in the structure tree?

---

## 01 — basic with name

Script: `scripts/01-basic.mjs` — ✅ partId=4, type number, maxLevel 31, messages `[]`. Structure has 24 nodes.

## 02 — no params (empty object)

Script: `scripts/02-no-params.mjs` — ✅ partId=4. Default name is "Part", class is `CC_Part`.

## 03 — no argument

Script: `scripts/03-no-arg.mjs` — ✅ works, partId=4, maxLevel 31.

## 04 — double create

Script: `scripts/04-double-create.mjs` — ⚠️ **Critical finding.**

**Learned:** Second `part.create` returns `null` (not a new ID). The first part ("First") is still in the structure tree with all 24 nodes. The drawing is NOT cleared — the docs say "Clears the drawing and creates a new part" but observed behavior is: second call is a no-op that returns null.

📌 LLM doc: `part.create` only works once per session. Second call returns `null` — does NOT clear and recreate. The harness already calls `common.clear` between scripts, so each script starts fresh. But within a single script, calling `part.create` twice is a bug.

## 05 — extra params

Script: `scripts/05-extra-params.mjs` — ✅ extra params silently ignored, partId=4.

## 06 — structure tree detail

Script: `scripts/06-structure-detail.mjs` — ✅ rich structural findings.

**Learned:**
- `root` = 4 (same as partId, but `structure.root` points to the part, not AllObjects)
- Actually: node 1 = AllObjects (parent=null, children: [4, 50]). Node 4 = part.
- Wait — `structure.root` = 4 but AllObjects id=1 has parent=null. `root` means "root product", not tree root.
- `currentProduct` = 4 (the part), `currentInstance` = 0
- Part (node 4) has 7 children: ExpressionSet(6), DimensionSet(8), GeometrySet(10), ReferenceSet(12), SketchSet(14), EntitySet(16), OperationSequence(18)
- GeometrySet(10) contains default work geometry: Origin, XAxis, YAxis, ZAxis, Top, Front, Right
- OperationSequence(18) contains references to all default work geometry + RollbackBar(20)
- All default nodes have flags=4096

📌 LLM doc: Document full structure tree layout. Default work geometry names (Top, Front, Right, Origin, XAxis, YAxis, ZAxis). The sets architecture.

## 07 — snapshot

Script: `scripts/07-snapshot.mjs` — ✅ produces .ofb and .stp files but no PNG (empty part has no visible geometry).

---

## Coverage Checklist

- [x] API called at least once successfully
- [x] Required parameters tested (none — all optional)
- [x] Key optional parameter `name` exercised
- [x] No enum values apply
- [x] No update/delete method for part.create itself
- [x] Realistic usage: structure tree inspection, double-create edge case
- [x] Snapshot attempted (empty part — no visible geometry)

## Summary

`part.create` initializes a new part with ID 4 (always 4 in a clean session). Default name "Part". Creates 24-node structure tree with sets and default work geometry. **Critical: second `part.create` in same session returns `null`** — it does NOT clear and recreate as docs suggest.
