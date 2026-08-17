# Training: sketch.create

**Date:** 2026-04-08

## Goal

Testing `v1.sketch.create` (and its alias `v1.part.sketch`) — sketch lifecycle creation.

**Methods to cover:**

- `sketch.create` — basic call with just part ID (default XY plane)
- `sketch.create` params: `id` (required), `planeId` (optional — face or work plane), `name` (optional, default "Sketch")
- `part.sketch` — alias with identical signature, verify same behavior
- `part.getSketch` — retrieve sketch by name
- `sketch.setWorkPlane` — reassign sketch to different work plane after creation
- `sketch.deleteSketch` — delete sketches by IDs

**Questions:**

- What does the returned ID represent — a feature ID or a sketch-specific ID?
- What happens when no planeId is given — which default plane is used?
- Can you create multiple sketches on the same work plane?
- What happens with duplicate sketch names?
- Does `part.getSketch` find by exact name only? What about duplicates?
- What does `sketch.setWorkPlane` return? Does it move existing geometry?
- What does `sketch.deleteSketch` return for invalid IDs?
- Can you create a sketch on a face (not a work plane)?
- What does the structure tree look like after sketch creation?

---

## 01 — basic sketch.create

Script: `scripts/01-basic-create.mjs` — ✅ Returns sketch ID (52), maxLevel=31 (info), no messages.

**Data:** `result: 52`, `maxLevel: 31`, `messages: []`. Structure tree shows sketch as a `CC_Sketch` node. See `files/01-basic-create-create-response.json`.

## 02 — named sketch

Script: `scripts/02-named-sketch.mjs` — ✅ Custom name works. Returns ID 52, maxLevel=31.

## 03 — sketch on work plane

Script: `scripts/03-on-workplane.mjs` — ✅ Created work plane (normal=[0,1,0], XZ orientation), then sketch on it. Sketch ID=60, maxLevel=31.

**Data:** Work plane ID=54, sketch ID=60. Both succeeded with no errors.

## 04 — multiple sketches on same part

Script: `scripts/04-multiple-sketches.mjs` — ✅ Three sketches created, each gets a unique ID (52, 58, 64). IDs increment by 6 — each sketch creates ~3 internal objects.

## 05 — duplicate names (important)

Script: `scripts/05-duplicate-names.mjs` — ✅ Duplicate names are **allowed** with no warning. Each gets a unique ID (52, 58, 64). No error or warning messages.

**📌 LLM doc:** Duplicate sketch names are silently accepted. Use unique names if you plan to use `getSketch`.

## 06 — part.sketch alias

Script: `scripts/06-part-sketch-alias.mjs` — ✅ `part.sketch` behaves identically to `sketch.create`. Both return sketch IDs with maxLevel=31.

**Data:** `sketch.create` → 52, `part.sketch` → 58. Same behavior, same return type.

## 07 — part.getSketch

Script: `scripts/07-get-sketch.mjs` — ✅ Retrieves sketch by exact name match. Returns matching ID.

**Data:** Created sketch ID=52, `getSketch` returns 52 (exact match). Non-existent name returns `null` with maxLevel=51, error code 1015: "Sketch with name 'DoesNotExist' does not exist".

**📌 LLM doc:** `getSketch` returns null + error for missing names. Error code 1015.

## 08 — getSketch with duplicate names

Script: `scripts/08-get-sketch-duplicates.mjs` — ✅ When multiple sketches share a name, `getSketch` returns the **first one created** (ID 52 out of 52, 58, 64).

**📌 LLM doc:** `getSketch` returns the first match. Duplicate names → only first accessible by name.

## 09 — sketch.setWorkPlane

Script: `scripts/09-set-workplane.mjs` — ✅ Returns `null` (VOID), maxLevel=31. Successfully reassigns the sketch to a different plane.

**Data:** `result: null, maxLevel: 31, messages: []`. VOID return is expected per docs.

## 10 — sketch.deleteSketch

Script: `scripts/10-delete-sketch.mjs` — ✅ Single and batch delete both work. Returns `null` (VOID), maxLevel=31.

**Data:** Both single `ids: [sk1]` and multi `ids: [sk2, sk3]` return VOID with no errors.

## 11 — deleteSketch error cases

Script: `scripts/11-delete-invalid.mjs` — ✅ Invalid/already-deleted IDs → maxLevel=51, error code 1006 ("invalid id"). Empty array → VOID, no error (no-op).

**Data:** Invalid ID gets warning (41) "ToId()/TOID() didn't get an existing or valid id" + error (51) code 1006. Empty `ids: []` is a silent success (maxLevel=31).

**📌 LLM doc:** Empty `ids: []` is a no-op success. Invalid IDs give error 1006.

## 12 — sketch on a face (important)

Script: `scripts/12-on-face.mjs` — ✅ **Sketches can be placed on brep faces!** Created a box, extracted face IDs from `graphic.containers[0].meshes`, then passed face ID as `planeId`. Result: sketch ID=89, maxLevel=31, no errors.

**Data:** Box face IDs: [79, 80, 84, 81, 82, 83]. Used face 79. Sketch created successfully. Per the docs: "if planeId is a face, a new work plane on that face will be created".

**📌 LLM doc:** When `planeId` is a face, the system auto-creates a work plane on that face. This is how you sketch on existing solid geometry.

## 13 — structure tree after creation (important)

Script: `scripts/13-structure-after-create.mjs` — ✅ Creating one sketch adds **3 objects** to the tree:
- `CC_Sketch` (ID 52, parent: feature list node 14) — the sketch itself
- `CC_SketchReference` (ID 54, name: "InspectMeRef", parent: geometry set node 18) — reference geometry
- `CC_SketchDimensionSet` (ID 56, parent: dimension set node 8) — dimension container

**📌 LLM doc:** Sketch creation produces 3 internal objects. The returned ID is the `CC_Sketch` node. The `CC_SketchReference` and `CC_SketchDimensionSet` are internal bookkeeping.

## 14 — sketch with geometry

Script: `scripts/14-sketch-with-geometry.mjs` — ✅ Rectangle worked (returns array of 4 line IDs: [58, 64, 70, 76]). Circle **failed** — used `center` instead of `centerPos` (wrong param name). Not a sketch.create issue.

**Data:** Rectangle maxLevel=31, circle maxLevel=51 (param error). The circle failure is due to using the wrong parameter name — `sketch.circle` expects `centerPos`, not `center`. This is a future training item, not a sketch.create finding.

## 15 — default plane inspection

Script: `scripts/15-default-plane.mjs` — ✅ Default sketch (no planeId) uses XY plane at origin.

**Data:** Sketch node coordinateSystem: `[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]` = origin at (0,0,0), X axis = [1,0,0], Y axis = [0,1,0], Z (normal) = [0,0,1] → XY plane. `planeReference: 0` (no explicit reference — default).

**📌 LLM doc:** Default sketch plane is XY at origin. `planeReference=0` means no explicit work plane reference.

## 16 — error cases (no part ID, invalid ID)

Script: `scripts/16-no-part-id.mjs` — ✅ Missing `id` → error 1004 "parameter 'id' must be provided". Invalid ID → warning + error 1006 "invalid id".

**Data:** Both return `null`, maxLevel=51. Clear error messages.

## 17 — setWorkPlane error cases (important)

Script: `scripts/17-setworkplane-invalid.mjs` — ✅ `setWorkPlane` **only accepts work plane IDs** (type `"workplane"`). A sketch ID or part ID gives error 1001: "wrong id type".

**Data:** Invalid ID → error 1006. Sketch ID → error 1001 "Provide only following id types: [\"workplane\"]". Part ID → same error 1001. This means `setWorkPlane` cannot accept face IDs — unlike `sketch.create` which can accept faces.

**📌 LLM doc:** `setWorkPlane` only accepts work plane IDs. Unlike `sketch.create`, it does NOT accept face IDs. To move a sketch to a face, you must first create a work plane on that face, then use `setWorkPlane` with the work plane ID.

## 18 — multiple sketches on same plane

Script: `scripts/18-multiple-on-same-plane.mjs` — ✅ Two sketches on the same work plane both succeed. maxLevel=31 for both.

## 19 — delete then getSketch

Script: `scripts/19-delete-then-get.mjs` — ✅ After deletion, `getSketch` returns null with maxLevel=51 (error). The sketch is fully removed.

**Data:** Before delete: found ID 52. After delete: result=null, maxLevel=51, error "Sketch with name 'WillBeDeleted' does not exist".

## 20 — part.sketch with planeId

Script: `scripts/20-part-sketch-with-plane.mjs` — ✅ `part.sketch` with `planeId` works identically to `sketch.create` with `planeId`. Result: ID=60, maxLevel=31.

---

## Coverage Checklist

- [x] `sketch.create` called successfully (01)
- [x] Required `id` parameter tested (01, 16)
- [x] Optional `name` parameter tested (02)
- [x] Optional `planeId` with work plane tested (03)
- [x] Optional `planeId` with face tested (12)
- [x] `part.sketch` alias tested (06, 20)
- [x] `part.getSketch` tested (07, 08, 19)
- [x] `sketch.setWorkPlane` tested (09, 17)
- [x] `sketch.deleteSketch` tested (10, 11, 19)
- [x] Multiple sketches on same part (04, 18)
- [x] Duplicate names behavior (05, 08)
- [x] Error cases: missing ID, invalid ID (16)
- [x] Error cases: delete invalid/already-deleted (11)
- [x] Error cases: setWorkPlane with wrong ID types (17)
- [x] Structure tree inspection (13)
- [x] Default plane verification (15)
- [x] Realistic usage with geometry (14)
