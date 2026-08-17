# Training: assembly.create

**Date:** 2026-04-21

## Goal

Testing `v1.assembly.create` — the root assembly creation API.

**Methods to cover:**

- `create` — no params (defaults)
- `create` — with `name` param
- `create` — with `ident` param
- `create` — with both `name` and `ident`
- Return value inspection (assembly root ID)
- Structure tree after create (what gets built automatically)
- Relationship to `part.create` — does `assembly.create` also clear the drawing?
- Multiple calls — can you create multiple root assemblies?
- Integration: create → partTemplate → instance (minimal assembly flow)

**Questions:**

- What does the returned ID represent in the structure tree?
- Does `assembly.create` clear existing drawing content like `part.create` does?
- What is the default name if none is provided?
- What does the `ident` param do and how is it different from `name`?
- What structure exists immediately after `assembly.create` (containers, etc.)?

---

## 01 — basic create (no params, empty object)

Script: `scripts/01-basic-create.mjs` — ✅ Returns ID 12 (CC_AssemblyRoot). maxLevel 31 (info), empty messages array.

**Data:** Structure tree has 8 nodes. AllObjects (1) → children [4, 6, 8, 10, 12]. The root assembly (12) has children [14, 16, 18] — ExpressionSet, ConstraintSet, GeometrySet. `currentProduct` and `currentInstance` both point to 12. Default name: "AssemblyRoot". See `files/01-basic-create-structure.json`.

**📌 LLM doc:** Default name is "AssemblyRoot". Returns the root assembly ID. Structure auto-creates PartContainer (8), AssemblyContainer (10), and the root assembly (12) with three child sets.

## 02 — named create

Script: `scripts/02-named-create.mjs` — ✅ Custom name works as expected.

**Data:** `name: 'MyAssembly'` sets both `root.name` and `root.members.originalName.value` to "MyAssembly". Same ID (12), same maxLevel (31).

## 03 — with ident param

Script: `scripts/03-with-ident.mjs` — ✅ `ident` param accepted, but not visible in the root node's members.

**Data:** The root members keys are: `_VERSION, featureRootPath, cadRootPath, unit, activeDock, isFileAssemblyNode, originalName`. No "ident" key found. The ident is stored elsewhere — investigated in script 08.

## 04 — clears drawing test

Script: `scripts/04-clears-drawing.mjs` — ❌ `assembly.create` does NOT clear the drawing. Returns null with maxLevel 51 (error) when a part already exists.

**Data:** After `part.create`, the tree has 24 nodes. `assembly.create` returns `null`, tree stays at 24 nodes, part still exists. See `files/04-clears-drawing-clears-drawing.json`.

**📌 LLM doc:** Unlike `part.create`, `assembly.create` does NOT clear the drawing. It fails with error code 1200 if any root product (part or assembly) already exists.

## 05 — error message details

Script: `scripts/05-clears-drawing-messages.mjs` — Confirmed error message: `"There is already a root assembly or part which must be removed first."` Error code 1200, level 51.

**Data:** See `files/05-clears-drawing-messages-error-after-part.json`.

**📌 LLM doc:** Error code 1200 = drawing already has content. Must `common.clear()` first.

## 06 — double create

Script: `scripts/06-double-create.mjs` — ❌ Second `assembly.create` also fails with error 1200. Only one root assembly allowed per drawing.

**Data:** Same error message and code as script 05.

**📌 LLM doc:** One root assembly per drawing. Can't create two.

## 07 — ident via userData check

Script: `scripts/07-ident-via-userdata.mjs` — `ident` is NOT stored as userData (keys array empty). But the root has 4 children instead of 3 — extra child ID 22.

**Data:** Children: [14, 16, 18, 22]. The extra child is investigated in script 08.

## 08 — ident child node inspection

Script: `scripts/08-ident-child-inspect.mjs` — ✅ The `ident` param creates an IdentToIdMap child node.

**Data:** Extra child 22: `name: "IdentMap", class: "IdentToIdMap"`. Contains a `map` member with array entry mapping `"ASM-008" → ID 12`. See `files/08-ident-child-inspect-extra-child.json`.

**📌 LLM doc:** `ident` creates an IdentToIdMap child that maps the string identifier to the root assembly ID. Useful for looking up objects by string identifier later. Only created when `ident` is provided.

## 09 — no ident children comparison

Script: `scripts/09-no-ident-children.mjs` — ✅ Without `ident`, only 3 children: ExpressionSet, ConstraintSet, GeometrySet. No IdentMap.

**Data:** Confirms ident is optional and only adds the IdentMap when provided.

## 10 — clear then create

Script: `scripts/10-clear-then-create.mjs` — ✅ `assembly.create` → `common.clear` → `assembly.create` works. Second create succeeds with new ID 12 and new name.

**Data:** Both creates return ID 12 (IDs reset after clear). maxLevel 31 on both.

**📌 LLM doc:** Use `common.clear()` before `assembly.create` if the drawing already has content.

## 11 — AllObjects nodes

Script: `scripts/11-allobjects-nodes.mjs` — AllObjects has children [4, 6, 8, 10, 12]. Nodes 4 and 6 are not in the structure tree (internal/hidden).

**Data:** 8 = PartContainer (CC_PartContainer, flags 16), 10 = AssemblyContainer (CC_AssemblyContainer), 12 = AssemblyRoot. Nodes 4, 6 undefined in tree.

## 12 — empty name

Script: `scripts/12-empty-name.mjs` — ✅ Empty string name is accepted. Root gets empty `name` and empty `originalName`.

**Data:** No error. Assembly created successfully with blank name.

## 13 — no params at all

Script: `scripts/13-no-params.mjs` — ✅ Calling with no argument at all (not even `{}`) works. Default name "AssemblyRoot".

**Data:** result=12, maxLevel=31.

## 14 — minimal assembly flow

Script: `scripts/14-minimal-assembly-flow.mjs` — ✅ Full create → partTemplate → box → setCurrentProduct → instance flow works.

**Data:** asmId=12, tplId=22, boxId=70, instanceId=105. `setCurrentProduct` returns the previous product ID (22 = the part template). Root instances=[105], instancesNested=[105]. See `files/14-minimal-assembly-flow-flow-result.json`.

| ![assembly](files/14-minimal-assembly-flow-minimal-assembly-solid.png) |
|---|

**📌 LLM doc:** After `assembly.create`, use `assembly.partTemplate` to create parts, build geometry inside them, then `assembly.setCurrentProduct` to return to assembly context, then `assembly.instance` to instantiate.

## 15 — part then clear then assembly

Script: `scripts/15-part-then-clear-then-asm.mjs` — ✅ `part.create` → `clear` → `assembly.create` works fine.

**Data:** Confirms `clear` removes the part context and allows assembly creation.

## 16 — structure after create

Script: `scripts/16-structure-after-create.mjs` — 8 total nodes in tree after create.

**Data:** Root children: ExpressionSet (members: _VERSION), ConstraintSet (members: _VERSION), GeometrySet (members: _VERSION, csSize). See `files/16-structure-after-create-node-catalog.json`.

## 17 — rename after create

Script: `scripts/17-rename-after-create.mjs` — ✅ `common.setObjectName` works on the assembly root. Changes display `name` but `originalName` retains the creation-time value.

**Data:** After rename: name="Renamed", originalName="Original".

**📌 LLM doc:** `originalName` member is immutable — always the creation-time name. `setObjectName` only changes the display name.

## 18 — maxLevel analysis

Script: `scripts/18-maxlevel-meaning.mjs` — Successful create: maxLevel=31 with empty messages array. Failed create: maxLevel=51 with error code 1200.

**Data:** The maxLevel=31 on success is an info-level internal notification, not a user-facing warning. Messages array is empty for success.

## 19 — hidden nodes

Script: `scripts/19-hidden-nodes.mjs` — Nodes 4 and 6 are valid objects (getUserDataKeys returns [] without error) but not included in the structure tree. Internal infrastructure.

## 20 — special characters in name

Script: `scripts/20-special-chars-name.mjs` — ✅ Special characters accepted but sanitized in the display name.

**Data:** Input: `"My Assembly (v2) — test/spec"` → display name: `"My_Assembly__v2__—_test_spec"` (spaces→_, parentheses→_, slash→_). `originalName` preserves the original string exactly.

**📌 LLM doc:** Name is sanitized: spaces, parentheses, slashes → underscores. `originalName` preserves the original input.
