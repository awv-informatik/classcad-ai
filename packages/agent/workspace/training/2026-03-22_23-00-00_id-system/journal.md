# Training: ID System

**Date:** 2026-03-22

## Goal

Studying the ID system: opaque references, how IDs are returned from creation APIs and consumed by subsequent APIs.

**Questions to answer:**

- What JS type are IDs? (number, string, object?) Confirm they are positive integers.
- What is the ID gap pattern? How many child objects does `part.create` produce?
- Can you pass IDs as strings? As floats? As zero? As negative numbers? What errors result?
- How do IDs flow from creation → consumption? (e.g., `part.create` → `part.box` → `updateBox`)
- Do `create` vs `update` APIs expect different ID types? (part ID vs feature ID)
- What happens when you pass the wrong kind of ID? (feature ID where part ID expected, vice versa)
- Can you inspect IDs via the structure tree? What info does structure carry about IDs?
- Do IDs persist across calls? Are they stable within a session?
- What does `clear` with `keepIds` do to IDs?
- How does `common.batch` handle IDs? Can you reference IDs from earlier jobs?
- What does the `id` param type `string | real | id` actually mean in practice?

## 01 — ID type and gap pattern

Script: `scripts/01-id-type-and-gaps.mjs` — ✅ IDs are JS numbers (positive integers).

- `part.create` → 4
- `part.box` → 54 (gap of 50 from part)
- second `part.box` → 91 (gap of 37 from first box)
- `sketch.create` → 126 (gap of 35 from second box)

**Learned:** IDs are always `typeof === 'number'` and `Number.isInteger() === true`. Positive, non-zero. Gaps are variable — each creation allocates many internal child objects (work geometry, operation references, solids, etc.). The gap size depends on the object type.
**📌 LLM doc:** IDs are JS integers with variable gaps — don't assume sequential or constant spacing.

## 02 — ID as string, float, invalid values

Script: `scripts/02-id-as-string-float-invalid.mjs` — ✅ String works, everything else fails.

| Input | Works? | Error |
|-------|--------|-------|
| `4` (integer) | ✓ | — |
| `"4"` (string) | ✓ | — |
| `4.5` (float) | ❌ | ToId() warning + code 1006 |
| `0` | ❌ | code 1007 "not a part id" |
| `-1` | ❌ | code 1007 "not a part id" |
| `null` | ❌ | code 1004 "id must be provided" |
| `true` | ❌ | code 1007 "not a part id" |
| `99999` (nonexistent) | ❌ | ToId() warning + code 1006 |

**Learned:** `string | real | id` in practice means: pass an integer number or a string representation of one. Floats, zero, negative, null, booleans, and nonexistent IDs all fail. The `ToId()` warning is a specific indicator that the value couldn't be resolved to a valid object.
**📌 LLM doc:** Document the accepted ID formats and the error codes for each failure mode.

## 03 — Wrong ID type errors

Script: `scripts/03-id-flow-and-wrong-type.mjs` — ✅ Wrong ID type → code 1007.

- Feature ID where part expected: code 1007 "not a part id"
- Part ID where feature expected: code 1007 "not a feature or work geometry id"
- Sketch ID where part expected: code 1007 "not a part id"

**Learned:** The server validates not just existence but the *class* of the ID. Error 1007 = "right format, wrong type". Error 1006 = "doesn't exist at all". This is the key distinction.

## 04 — updateBox requires active/open feature

Script: `scripts/04-updatebox-debug.mjs` — ❌ updateBox fails on a completed feature.

Error: "The provided feature is not allowed to update. It's not active and open." (code 1200).

**Learned:** Features have a state machine — they are "active and open" during creation but become locked after. `updateBox` (and presumably all `update*` methods) requires the feature to be in an editable state. This is a parametric modeling concept — features must be explicitly reopened for editing.
**📌 LLM doc:** Document that update* methods require feature to be active/open.

## 05–07 — Structure tree and object hierarchy

Scripts: `scripts/05-structure-tree-ids.mjs`, `scripts/06-structure-raw.mjs`, `scripts/07-structure-all-ids.mjs`

The structure tree is a flat map keyed by string ID: `structure.tree["4"]`.

After `part.create` (partId=4), 24 objects exist:

| ID | Class | Name | Parent |
|----|-------|------|--------|
| 1 | AllObjects | AllObjects | null |
| 4 | CC_Part | TestPart | 1 |
| 6 | CC_ExpressionSet | ExpressionSet | 4 |
| 8 | CC_DimensionSet | DimensionSet | 4 |
| 10 | CC_GeometrySet | GeometrySet | 4 |
| 12 | CC_ReferenceSet | ReferenceSet | 4 |
| 14 | CC_SketchSet | SketchSet | 4 |
| 16 | CC_EntitySet | EntitySet | 4 |
| 18 | CC_OperationSequence | OperationSequence | 4 |
| 20 | CC_RollbackBar | RollbackBar | 18 |
| 22 | CC_WorkPoint | Origin | 10 |
| 24–48 | Work geometry refs | Axes, Planes, Refs | 10/18 |

After `part.box`, 3 new objects: CC_Box (54, parent=EntitySet), CC_OperationReference (56), CC_Solid (87).

**Learned:** `structure.root` gives the part ID. The tree shows every object with `id`, `class`, `name`, `parent`, `children`, `members`. Structure metadata: `{ root, currentProduct, currentInstance, testRoot, tree }`.
**📌 LLM doc:** Document structure tree format and the standard part hierarchy.

## 08 — ID persistence within session

Script: `scripts/08-id-persistence.mjs` — ✅ IDs are stable and reusable across calls.

`setObjectName` and `setUserData` work on any previously created ID (part, feature, etc.) throughout the session. No ID expiration or invalidation during normal use.

## 09 — clear with keepIds

Script: `scripts/09-clear-keepids.mjs` — ✅ keepIds preserves the entire subtree.

`clear({ keepIds: [partId] })` keeps the part and ALL its children — features, solids, work geometry, everything. 30 objects survived. All IDs remained valid.

**📌 LLM doc:** keepIds preserves the entire object subtree, not just the named object.

## 10 — IDs after full clear

Script: `scripts/10-ids-after-full-clear.mjs` — ✅ Full clear invalidates all IDs. IDs restart.

After `clear()`, old partId (4) and boxId (54) become invalid. Creating a new part gives partId=4 again. IDs restart from the same sequence, not from where the old ones left off.

**📌 LLM doc:** After full clear, IDs restart and old references are dead.

## 11 — Cross-domain ID usage

Script: `scripts/11-cross-domain-ids.mjs` — ✅ IDs are universal across domains.

- `common.setObjectName` works on sketch IDs, work plane IDs, internal child IDs (ExpressionSet)
- `common.setUserData` works on sketch IDs
- `common.transformObjectWithMatrix` works on work plane IDs
- The `common.*` APIs accept any valid object ID regardless of class

## 12 — Batch ID referencing

Script: `scripts/12-batch-id-referencing.mjs` — ✅ Batch can use IDs from earlier jobs, but only if you know them in advance.

Because part.create always returns ID 4 (on a clean drawing), you can hardcode `id: 4` in subsequent batch jobs. There is no dynamic ID forwarding mechanism in batch — you must predict or pre-know the IDs.

**📌 LLM doc:** Batch has no dynamic ID referencing — use predictable IDs or execute sequentially.

## 13 — ID parameter format variants

Script: `scripts/13-id-param-variants.mjs` — ✅ Very permissive string parsing.

| Input | Works? |
|-------|--------|
| `4` (integer) | ✓ |
| `"4"` (string) | ✓ |
| `" 4 "` (padded) | ✓ |
| `"4.0"` (float string) | ✓ |
| `{id: 4}` (object) | ❌ |
| omitted | ❌ |
| `""` (empty) | ❌ |

**Learned:** The ID parser is very permissive with strings — it trims whitespace and parses float strings to integers. But it does NOT accept JS objects. The `id` type in `string | real | id` means the internal ClassCAD ID type, which maps to JS number or string-of-number.
**📌 LLM doc:** Document the permissive string parsing (trim, float-to-int coercion).

## 14 — Array<id> parameters

Script: `scripts/14-array-of-ids.mjs` — ✅ String IDs work in arrays too.

`requestVisualisation({ ids: [String(boxId), String(cylId)] })` works. `clear({ keepIds: [String(partId)] })` works. String/number interchangeable everywhere.

## 15 — ID type validation error messages

Script: `scripts/15-id-hierarchy-and-class.mjs` — ✅ Some APIs give helpful type error messages.

- `sketch.create(featureId)` → code 1001: "wrong id type! Provide only following id types: [\"part\"]"
- `part.box(sketchId)` → code 1007: "not a part id"

**Learned:** Code 1001 gives you the list of valid types. Code 1007 is less helpful. Different APIs use different error codes for wrong-type IDs.
**📌 LLM doc:** Error code 1001 lists valid ID types; 1007 just says "wrong type".

## 16 — Special IDs (0, 1, 2, 3, 50)

Script: `scripts/16-special-ids.mjs`

| ID | Exists? | Class |
|----|---------|-------|
| 0 | ❌ | — |
| 1 | ✓ | AllObjects (root of everything) |
| 2 | ✓ | unknown (accepts setObjectName) |
| 3 | ❌ | — |
| 50 | ✓ | unknown (listed as AllObjects child, not in structure tree) |

`setUserData` works on ID 1 (AllObjects). `structure.currentInstance = 0` is not a valid ID — 0 means "no instance".

## 17 — Sketch element IDs

Script: `scripts/17-sketch-internal-ids.mjs` — ✅ Sketch elements are first-class objects.

- `sketch.line` returns a single ID (58)
- `sketch.circle` returns a single ID (66)
- `sketch.rectangle` returns `Array<id>` of 4 IDs (one per line segment)
- Sketch element IDs work with `common.setObjectName` — they're full objects in the ID system

## 18 — ID numbering pattern

Script: `scripts/18-id-numbering-pattern.mjs` — IDs are NOT always even.

Odd IDs found in tree: AllObjects(1), CC_Solid(87), CC_Cylinder(91), CC_OperationReference(93), CC_Point(115, 123). No consistent even/odd pattern. IDs are simply monotonically increasing with variable gaps.

## 19–20 — Feature deletion and ID reuse

Scripts: `scripts/19-deleted-id-reuse.mjs`, `scripts/20-delete-and-reuse.mjs`

- `deleteFeature` expects `ids` (plural array), not `id`
- After deletion, the old ID becomes invalid — `setObjectName` returns maxLevel 51
- New features get fresh IDs that continue the monotonic sequence — IDs are NEVER recycled
- Gap sizes vary: box creation adds ~37 IDs worth of objects

**📌 LLM doc:** IDs are never recycled after deletion. Always forward-incrementing.
