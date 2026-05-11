# Training: assembly.createUncommitedObject

**Date:** 2026-05-11

## Goal

Testing `v1.assembly.createUncommitedObject` — two-phase creation of assembly objects.

**Methods to cover:**

- `createUncommitedObject` — basic creation with valid constraint types
- `createUncommitedObject` — with constraint types: CC_FastenedConstraint, CC_FastenedOriginConstraint, CC_RevoluteConstraint, CC_CylindricalConstraint, CC_PlanarConstraint, CC_ParallelConstraint, CC_SliderConstraint, CC_SphericalConstraint, CC_GearRelation, CC_GroupConstraint
- `createUncommitedObject` — with non-constraint types: CC_ProductReference, CC_LinearPatternConstraint, CC_CircularPatternConstraint
- Commit/decline pattern (analogous to part domain)
- Error cases: missing params, invalid type, singleton constraint

**Questions:**

- Does it follow the same commit/decline pattern as `part.createUncommitedObject`? → **Yes** (script 02)
- What CC_ types are valid for assembly domain? → **12 valid types** (script 04)
- Does it block other constraint creation while uncommitted? → **Yes, but differently than part** (script 03)
- Can we commit by calling the corresponding `update*` API between open/close? → **Yes** (scripts 02, 07, 08, 09)
- What does the declined flow look like? → **open → close with no update = removed** (scripts 02, 09)
- Does `openFeature`/`closeFeature` work or is there an assembly-specific open/close? → **`part.openFeature`/`part.closeFeature` work** (all commit scripts)

---

## 01 — basic creation

Script: `scripts/01-basic-creation.mjs` — ✅ `createUncommitedObject` creates an uncommitted constraint shell in the assembly. Returns the ID.

**Data:** result=196, maxLevel=31 (info), no error messages. The constraint appears in the structure tree.

---

## 02 — commit/decline pattern

Script: `scripts/02-commit-decline.mjs` — ✅ Both patterns work identically to the part domain.

**Commit flow:** `createUncommitedObject` → `part.openFeature` → `assembly.updateFastened` (with mate1/mate2) → `part.closeFeature`. Constraint persists and is queryable via `getFastened` (id=196, name="CommitFastened", full mate structure returned).

**Decline flow:** `createUncommitedObject` → `part.openFeature` → `part.closeFeature` (no update). Constraint removed. `getFastened` returns null with maxLevel=51 and error: "There couldn't be found a constraint with name..."

**📌 LLM doc:** Document commit/decline pattern — same as part domain but uses `part.openFeature`/`part.closeFeature` (NOT assembly-specific).

---

## 03 — singleton constraint behavior

Script: `scripts/03-singleton.mjs` — ⚠️ **Different from part domain!**

**Finding:** Multiple `createUncommitedObject` calls succeed (no singleton constraint). Second call returned result=119, maxLevel=31 — no error. However, normal constraint creation (`fastenedOrigin`) during uncommitted state fails with: "There are too many uncommited objects. Check the implementation." (maxLevel=51).

**📌 LLM doc:** Unlike `part.createUncommitedObject` which blocks the second call, assembly allows stacking uncommitted objects. But normal creation APIs (fastened, revolute, etc.) are blocked while ANY uncommitted exists. This is a behavioral difference from the part domain.

---

## 04 — valid CC_ types

Script: `scripts/04-valid-types.mjs` — ✅ Systematic test of 17 type strings.

**Valid types (12):**
| CC_ Type | Corresponding API |
|---|---|
| CC_FastenedConstraint | assembly.fastened / updateFastened |
| CC_FastenedOriginConstraint | assembly.fastenedOrigin / updateFastenedOrigin |
| CC_RevoluteConstraint | assembly.revolute / updateRevolute |
| CC_CylindricalConstraint | assembly.cylindrical / updateCylindrical |
| CC_PlanarConstraint | assembly.planar / updatePlanar |
| CC_ParallelConstraint | assembly.parallel / updateParallel |
| CC_SliderConstraint | assembly.slider / updateSlider |
| CC_SphericalConstraint | assembly.spherical / updateSpherical |
| CC_GearRelation | assembly.gear / updateGear |
| CC_GroupConstraint | assembly.group / updateGroup |
| CC_LinearPatternConstraint | assembly.linearPattern / updateLinearPattern |
| CC_CircularPatternConstraint | assembly.circularPattern / updateCircularPattern |

**Invalid types (5):**
- CC_BallConstraint — "non-existent class"
- CC_PrismaticConstraint — "non-existent class"
- CC_ProductReference — "Function Initialize not found" (not a constraint type)
- CC_Assembly — "Function Initialize not found"
- CC_Part — "Function Initialize not found"

**📌 LLM doc:** Document the complete valid/invalid type table.

---

## 05 — error cases

Script: `scripts/05-error-cases.mjs` — ✅ All three params are required. Clear error messages.

**Data:** All error cases return null, maxLevel=51:
- Missing id: "The parameter \"id\" must be provided in the api call!" (code 1004)
- Missing type: "The parameter \"type\" must be provided in the api call!" (code 1004)
- Missing name: "The parameter \"name\" must be provided in the api call!" (code 1004)
- Invalid type: "non-existent class: InvalidType"
- Lowercase type: "non-existent class: cc_fastenedconstraint" — **case-sensitive**
- Invalid id: "has an invalid id!" (code 1006)
- Empty type: "non-existent class: " (empty string)

**📌 LLM doc:** All three params required. Types are case-sensitive.

---

## 06 — revolute commit (failed)

Script: `scripts/06-revolute-commit.mjs` — ❌ Used `references` instead of `csys` in mate params. Error: "The parameter \"csys\" must be provided."

Not a createUncommitedObject issue — just wrong update params.

---

## 07 — revolute commit (fixed)

Script: `scripts/07-revolute-commit-fixed.mjs` — ✅ Two-phase revolute works. `createUncommitedObject` with `CC_RevoluteConstraint` → `updateRevolute` (with csys mates) → constraint committed and queryable by `getRevolute`.

**Data:** uncommitted id=272, updateRevolute result=272, getRevolute confirms name="RevJoint".

---

## 08 — gear relation commit

Script: `scripts/08-gear-commit.mjs` — ✅ Two-phase gear creation works. `createUncommitedObject` with `CC_GearRelation` → `updateGear` (with constr1Id, constr2Id, ratio) → constraint committed. `getGear` confirms ratio=2.

**Data:** uncommitted id=279, updateGear result=279, getGear ratio=2.

**📌 LLM doc:** Pattern works for relations too, not just constraints.

---

## 09 — fastenedOrigin + duplicates + no-update decline

Script: `scripts/09-fastenedorigin-and-duplicates.mjs` — ✅ Multiple findings:

1. **FastenedOrigin commit:** updateFastenedOrigin with xOffset=10, zOffset=5 → committed. getFastenedOrigin confirms offsets.
2. **Duplicate names:** Creating a second uncommitted with the same name succeeds (result=123, maxLevel=31). Duplicate names are allowed.
3. **No-update = decline:** open → close with no update → getFastened returns null (constraint removed). Same as part domain.

**📌 LLM doc:** Duplicate names are allowed. No-update = decline (same as part).

---

## 10 — vs direct creation comparison

Script: `scripts/10-vs-direct-creation.mjs` — ✅ Two-phase creation produces structurally identical constraints to direct creation. The getFastened result for both methods has the same shape: id, mate1, mate2, name, xOffset, etc.

**Data:** Direct: id=200, xOffset=0. Two-phase: id=202, xOffset=20. Both have identical structure shape.

**📌 LLM doc:** Result is identical to direct creation — two-phase is just a different workflow, not a different constraint.

---

## Coverage Checklist

- [x] The API has been called at least once successfully (script 01)
- [x] Every required parameter has been tested (script 05 — id, type, name all required)
- [x] Key optional parameters — none exist (all three are required)
- [x] Every enum value / type variant has been exercised (script 04 — 12 valid, 5 invalid)
- [x] The corresponding update/query methods tested (scripts 02, 07, 08, 09, 10)
- [x] At least one realistic usage (scripts 07, 08, 10 — full commit workflows)
- [x] Behavioral claims verified with data (all scripts use filewrite + log values)
- [x] Every question in Goal answered with named script
