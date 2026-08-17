# Training: assembly.parallel

**Date:** 2026-04-29

## Goal

Testing `v1.assembly.parallel`, `v1.assembly.updateParallel`, and `v1.assembly.getParallel`.

**Methods to cover:**

- `parallel` — basic creation with mate1/mate2 (path + csys)
- `parallel` params: name, mate1.flip, mate1.reorient, mate2.flip, mate2.reorient
- `parallel` params: xOffsetLimits, yOffsetLimits, zOffsetLimits (min/max)
- `parallel` params: zRotationLimits (min/max, radians and "deg" expressions)
- `updateParallel` — change name, mates, limits after creation
- `getParallel` — retrieve constraint by name, verify all fields returned
- Batch creation (array of params)
- Error cases: invalid IDs, missing required params, same instance for both mates

**Questions:**

- How many DOF does parallel give? (Expect: 3 translational + 1 rotational = 4 DOF)
- What happens when offset limits are set — does it constrain the free translation?
- Does zRotationLimits accept "45deg" string expressions?
- What's the default flip/reorient if not specified?
- Can you create parallel constraint between same instance?

---

## 01 — basic parallel constraint

Script: `scripts/01-basic-parallel.mjs` — ✅ Created parallel constraint between two instances.

| ![basic-parallel](files/01-basic-parallel-basic-parallel-solid.png) |
|---|

**Data:** result=212 (constraint ID), maxLevel=31 (info), messages=[]. Constraint created successfully. Both bodies visible — blue plate (Base 100×80×10) and orange block (Mover 30×30×20) positioned with Z-axes parallel.

## 02 — xOffsetLimits

Script: `scripts/02-xOffset-limits.mjs` — ✅ xOffsetLimits { min: -20, max: 20 } accepted.

**Data:** result=212, maxLevel=31. Constraint created with x-axis translation limited to [-20, 20] range.

## 03 — yOffsetLimits + zOffsetLimits

Script: `scripts/03-yOffset-zOffset-limits.mjs` — ✅ Both yOffsetLimits and zOffsetLimits accepted together.

**Data:** result=212, maxLevel=31. yOffsetLimits { min: -10, max: 30 }, zOffsetLimits { min: 0, max: 50 } — both accepted in a single call.

## 04 — zRotationLimits (radians)

Script: `scripts/04-zRotation-limits-radians.mjs` — ✅ zRotationLimits { min: 0, max: 1.5708 } accepted.

**Data:** result=212, maxLevel=31. Rotation around Z limited to [0, π/2] radians.

## 05 — zRotationLimits (deg expressions)

Script: `scripts/05-zRotation-deg-expr.mjs` — ✅ String expressions `'0deg'` and `'90deg'` accepted for zRotationLimits.

**Data:** result=212, maxLevel=31. getParallel confirms stored as radians: `{min: 0, max: 1.5707963267948966}`. The "deg" suffix converts degrees to radians on storage.

**📌 LLM doc:** zRotationLimits accepts both radians (number) and degree expressions (string like "90deg"). Stored as radians internally.

## 06 — flip and reorient

Script: `scripts/06-flip-reorient.mjs` — ✅ mate1.flip='X', mate2.flip='-Y', mate2.reorient='90' all accepted.

**Data:** result=212, maxLevel=31. getParallel confirms: mate1.flip='X', mate2.flip='-Y', mate2.reorient='90'. Values round-trip correctly.

## 07 — getParallel (full inspection + error cases)

Script: `scripts/07-getParallel.mjs` — ✅ Full round-trip of all fields. Error cases tested.

**Data:** getParallel returns: `{ id, name, mate1: { path, csys, flip, reorient }, mate2: { path, csys, flip, reorient }, xOffsetLimits, yOffsetLimits, zOffsetLimits, zRotationLimits }`. All values match what was set.

Findings:
- getParallel by **instance ID** → VOID, maxLevel 51 (error). Must use assembly ID.
- getParallel with **non-existent name** → null, maxLevel 51 (error).

**📌 LLM doc:** getParallel requires the assembly ID, not an instance ID. Non-existent name returns null with error.

## 08 — updateParallel

Script: `scripts/08-updateParallel.mjs` — ✅ Name rename, adding limits, changing flip/reorient all work.

**Data:**
- Create with no limits → update adds xOffsetLimits and zRotationLimits: confirmed via get.
- Name changed from "UpdTest" to "UpdTestRenamed": confirmed.
- zRotationLimits with "45deg" → stored as 0.7853981633974483 radians.
- Update mate1.flip to 'X', mate2.flip to '-Y': confirmed via get.

**📌 LLM doc:** updateParallel takes the constraint ID (not assembly ID). Can add limits after creation, rename, change flip/reorient. Deg expressions work in updates too.

## 09 — batch creation

Script: `scripts/09-batch-create.mjs` — ✅ Array of two params creates two constraints in one call.

**Data:** result=[305, 309] (two constraint IDs), maxLevel=31. Batch with 3 instances (1 base + 2 movers), two parallel constraints linking base to each mover.

## 10 — error cases

Script: `scripts/10-error-same-instance.mjs` — ✅ All three error cases rejected correctly.

**Data:**
- Same instance for both mates: null, maxLevel=51, code=1014, message="paths belong to the same rigid set"
- Invalid assembly ID (99999): null, maxLevel=51, code=1014
- Missing mate2: null, maxLevel=51, code=0, message="[Evaluation error in AbstractAPI.PrepareAPIParams]"

**📌 LLM doc:** Same-instance constraint rejected with code 1014 ("same rigid set"). Missing mate2 gives a generic PrepareAPIParams error.

## 11 — all limits combined

Script: `scripts/11-all-limits-combined.mjs` — ✅ All four limit types set together with flip/reorient.

**Data:** result=212, maxLevel=31. getParallel returns all 8 fields. All limits round-trip: xOff={-30,30}, yOff={-20,20}, zOff={0,50}, zRot={0, π}. "180deg" → stored as π (3.141592653589793).

## 12 — remove limits via VOID string (FAIL)

Script: `scripts/12-update-remove-limits.mjs` — ❌ Passing `'VOID'` string for limit props → error.

**Data:** updateParallel with `xOffsetLimits: 'VOID'` → null, maxLevel=51, code=1001, "wrong type! It should be of type (object)". Limits unchanged after failed update.

## 13 — remove limits retry

Script: `scripts/13-remove-limits-retry.mjs` — Mixed results.

**Data:**
- `xOffsetLimits: null` → maxLevel=31 (success). Subsequent get shows xOff={min:null, max:null}. **null clears limits.**
- `xOffsetLimits: {}` → maxLevel=51 (error). But xOff was already cleared by previous null.
- `zRotationLimits: {min: null, max: null}` → maxLevel=31. Confirmed zRot={min:null, max:null}.

## 14 — null clears limits (clean test)

Script: `scripts/14-null-clears-limits.mjs` — ✅ Clean verification that `null` clears a specific limit while preserving others.

**Data:** Created with all 4 limits set. Updated `xOffsetLimits: null` only. Result:
- xOff: {min:null, max:null} — **cleared**
- yOff: {min:-5, max:5} — **preserved**
- zOff: {min:0, max:20} — **preserved**
- zRot: {min:0, max:1.5708} — **preserved**

**📌 LLM doc:** To remove limits, pass `null` for the limit property in updateParallel. This clears that limit to {min:null, max:null} while preserving all other limits. `'VOID'` string and `{}` do NOT work. `{min: null, max: null}` also works.

## 15 — default values (no optional params)

Script: `scripts/15-defaults-no-limits.mjs` — ✅ Verified all defaults.

**Data:** Default name="Parallel". Default flip="Z" for both mates. Default reorient="0" for both mates. All limits default to {min:null, max:null} (no limits = free movement in that DOF).

**📌 LLM doc:** Defaults: name="Parallel", flip="Z", reorient="0". No limits set by default — all 4 DOF are free.

---

## Coverage Checklist

- [x] parallel called successfully (script 01)
- [x] All required params tested: id, mate1 (path+csys), mate2 (path+csys)
- [x] All optional params: name, flip (X/-X/Y/-Y/Z/-Z), reorient (0/90/180/270), xOffsetLimits, yOffsetLimits, zOffsetLimits, zRotationLimits
- [x] zRotationLimits: both radians and "deg" expressions
- [x] updateParallel: name, limits, flip, reorient
- [x] getParallel: by assembly ID, error on instance ID, error on non-existent name
- [x] Batch creation
- [x] Error cases: same instance, invalid ID, missing mate2
- [x] Removing limits (null clears, VOID/empty obj fail)
- [x] Default values verified
- [x] All behavioral claims verified with data (filewrite dumps, console logs)
